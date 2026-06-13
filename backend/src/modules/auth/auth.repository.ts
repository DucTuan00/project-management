import { AppDataSource } from '@/config/database';
import { User } from '@/modules/auth/auth.entity';
import { IsNull } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

const userRepository = AppDataSource.getRepository(User);

export class AuthRepository {
  static async findByEmail(email: string): Promise<User | null> {
    return userRepository.findOne({
      where: { email: email.toLowerCase(), deletedAt: IsNull() },
    });
  }

  static async findById(id: string): Promise<User | null> {
    return userRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  static async findByVerificationToken(token: string): Promise<User | null> {
    return userRepository.findOne({
      where: { verificationToken: token, deletedAt: IsNull() },
    });
  }

  static async findByPasswordResetToken(token: string): Promise<User | null> {
    return userRepository.findOne({
      where: { passwordResetToken: token, deletedAt: IsNull() },
    });
  }

  static async create(data: Partial<User>): Promise<User> {
    const user = userRepository.create({
      id: uuidv4(),
      ...data,
    });
    return userRepository.save(user);
  }

  static async update(id: string, data: Partial<User>): Promise<User | null> {
    await userRepository.update(id, data);
    return this.findById(id);
  }

  static async save(user: User): Promise<User> {
    return userRepository.save(user);
  }

  static async delete(id: string): Promise<void> {
    await userRepository.softDelete(id);
  }
}
