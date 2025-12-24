import { SetMetadata } from '@nestjs/common';

//Декоратор @Public() - помечает эндпоинты которые доступны без токена (регистрация, логин).
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
