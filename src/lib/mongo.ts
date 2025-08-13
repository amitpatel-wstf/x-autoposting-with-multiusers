import mongoose from 'mongoose';
import { ENV } from './env';

class MongoClientSingleton {
  private static instance: MongoClientSingleton;
  private connected = false;

  private constructor() {}

  public static getInstance(): MongoClientSingleton {
    if (!MongoClientSingleton.instance) {
      MongoClientSingleton.instance = new MongoClientSingleton();
    }
    return MongoClientSingleton.instance;
  }

  public async connect(): Promise<typeof mongoose> {
    if (this.connected) return mongoose;

    mongoose.set('strictQuery', true);

    await mongoose.connect(ENV.DATABASE_URL, {
      // keep options minimal; mongoose v7+ handles defaults wel
    });

    this.connected = true;
    mongoose.connection.on('disconnected', () => {
      this.connected = false;
    });

    return mongoose;
  }
}

export const Mongo = MongoClientSingleton.getInstance();
