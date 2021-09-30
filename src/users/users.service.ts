import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput } from "./dtos/login.dto";
import { User } from "./entities/user.entity";
import { JwtService } from "src/jwt/jwt.service";
import { EditProfileInput, EditProfileOutput } from "./dtos/edit-profie.dto";
import { Verification } from "./entities/verification.entity";
import { VerifyEmailOutput } from "./dtos/verify-email.dto";
import { UserProfileOutput } from "./dtos/user-profile.dto";


@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Verification)
    private readonly verfications: Repository<Verification>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}
  // check if is a new user // create user & hash the password
  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      const isExist = await this.users.findOne({ email });
      if (isExist) {
        return {
          ok: false,
          error: 'Already we have a user',
        }
      };
      const user = await this.users.save(this.users.create({ email, password, role }));
      await this.verfications.save(this.verfications.create({ user }));
      return {
        ok: true,
      };
    } catch (error) {
      console.log(error);
      return {
        ok: false,
        error: "Couldn't create a user",
      }
    }
  }
  async login({
    email,
    password,
  }: LoginInput): Promise<{ error?: string; ok: boolean; token?: string }> {
    try {
      //find the user with the email
      const user = await this.users.findOne(
        { email },
        { select: ['password'] },
      );
      console.log(user);
      if (!user) {
        return {
          ok: false,
          error: 'Cannot find a user',
        };
      }
      //check if the password is correct
      const isCorrect = await user.checkPwd(password);
      if (!isCorrect) {
        return {
          ok: false,
          error: 'Wrong Password',
        };
      }
      const token = this.jwtService.sign(user.id);
      return {
        ok: true,
        token,
      };
      //make a JWT and give it to the user
    } catch (err) {
      return {
        ok: false,
        error: err,
      };
    }
  }

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.users.findOne({ id });
      if (user) {
        return {
          ok: true,
          user: user,
        };
      }
    } catch (error) {
      return { ok: false, error };
    }
  }

  async editProfile(
    userId: number,
    { email, password }: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      const user = await this.users.findOne(userId);
      if (email) {
        user.email = email;
        user.verified = false;
        await this.verfications.save(this.verfications.create({ user }));
      }
      if (password) {
        user.password = password;
      }
      this.users.save(user);
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: "Couldn't Edit",
      };
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verfications.findOne(
        { code },
        { relations: ['user'] },
      );
      if (verification) {
        verification.user.verified = true;
        await this.users.save(verification.user);
        await this.verfications.delete(verification.id);
        return { ok: true };
      }
      return { ok: false, error: 'Verification not found' };
    } catch (error) {
      return { ok: false, error };
    }
  }
}
