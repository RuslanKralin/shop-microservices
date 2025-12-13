import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { User } from './users/user.model';
import { RolesModule } from './roles/roles.module';
import { Role } from './roles/roles.model';
import { UserRoles } from './roles/user-roles.model';
import { AuthModule } from './auth/auth.module';
import { AppRedisModule } from './redis/redis.module';

@Module({
  imports: [
    AppRedisModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.${process.env.NODE_ENV}.env`,
    }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      models: [User, Role, UserRoles], // автоматически загружает все модели в папке models
      autoLoadModels: true, // автоматически загружает все модели в папке models
      synchronize: true, // автоматически создаёт таблицы (только для разработки!)
    }),
    UsersModule,
    RolesModule,
    AuthModule,

    // PostsModule,
  ],
  // controllers: [PostsController],
  providers: [], // тут то что содержит какую то логику и используется в компонентах
  exports: [], // то что мы хотим использовать в других компонентах
  controllers: [], // то что мы хотим использовать в других компонентах
})
export class AppModule {}
