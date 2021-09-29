import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateAccountInput, CreateAccountOutput } from "./dtos/create-account.dto";
import { LoginInput } from "./dtos/login.dto";
import { User } from "./entities/user.entity";


@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}
  // check if is a new user // create user & hash the password
  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      const isExist = await this.users.findOne({ email });
      if( isExist ) {
        return {
          ok: false,
          error: 'Already we have a user'
        }
      };
      const user = await this.users.save(
        this.users.create({ email, password, role }),
      );
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
      const user = await this.users.findOne({ email });
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
      return {
        ok: true,
        token: 'adfsadfiwehf!',
      };
      //make a JWT and give it to the user
    } catch (err) {
      return {
        ok: false,
        error: err,
      };
    }
  }
}
