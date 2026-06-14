import { DataSource, Repository } from 'typeorm';
import { User } from '@/modules/auth/auth.entity';
import { IsNull } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class AuthRepository {
  private readonly repo: Repository<User>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = dataSource.getRepository(User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({
      where: { email: email.toLowerCase(), deletedAt: IsNull() },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.repo.findOne({
      where: { verificationToken: token, deletedAt: IsNull() },
    });
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.repo.findOne({
      where: { passwordResetToken: token, deletedAt: IsNull() },
    });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.repo.create({
      id: uuidv4(),
      ...data,
    });
    return this.repo.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async save(user: User): Promise<User> {
    return this.repo.save(user);
  }

  async delete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
