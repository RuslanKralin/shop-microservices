import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { RolesModule } from 'src/roles/roles.module';
import { KafkaModule } from '../kafka/kafka.module';
@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [
    forwardRef(() => UsersModule),
    JwtModule.register({
      secret: 'secretKey',
      signOptions: { expiresIn: '24h' },
    }),
    RolesModule,
    KafkaModule,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
