import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { CoreEntity } from "src/common/entities/core.entity";
import { BeforeInsert, Column, Entity } from "typeorm";
import * as bcrypt from 'bcrypt';
import { InternalServerErrorException } from "@nestjs/common";
import { IsEmail, IsEnum } from "class-validator";

enum UserRole {
  Client,
  Owner,
  Delivery,
}

registerEnumType(UserRole, { name: 'UserRole' });

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Column()
  @Field(type => String)
  @IsEmail()
  email: string;

  @Column()
  @Field(type => String)
  password: string;

  @Column({ type: 'enum', enum: UserRole })
  @Field(type => UserRole)
  @IsEnum(UserRole)
  role: UserRole;

  @BeforeInsert()
  async hashPwd(): Promise<void> {
    try {
      this.password = await bcrypt.hash(this.password, 12);
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async checkPwd(aPwd): Promise<boolean> {
    try {
      const ok = await bcrypt.compare(aPwd, this.password);
      return ok;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }
}
