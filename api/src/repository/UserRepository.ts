import CredentialsRepository from "@database/repositories/CredentialsRepository";
import { TiendanubeAuthInterface } from "@features/auth";

/**
 * this repository delegates to PostgreSQL CredentialsRepository
 * Previously stored credentials in lowdb (db.json) - now using PostgreSQL
 */

class UserRepository {
  async save(credential: TiendanubeAuthInterface): Promise<void> {
    // Delegating to PostgreSQL CredentialsRepository
    await CredentialsRepository.save(credential);
  }

  async findOne(user_id: number): Promise<TiendanubeAuthInterface> {
    // Delegating to PostgreSQL CredentialsRepository
    return await CredentialsRepository.findOne(user_id);
  }

  async findFirst(): Promise<TiendanubeAuthInterface> {
    // Delegating to PostgreSQL CredentialsRepository
    return await CredentialsRepository.findFirst();
  }
}

export default new UserRepository();
