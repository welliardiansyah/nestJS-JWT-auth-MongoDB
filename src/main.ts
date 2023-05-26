import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';

const logger = new Logger('main');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory: (errors) => {
        return new BadRequestException(
          errors.map((err) => {
            const { value, property, constraints } = err;
            return { value, property, constraints: Object.values(constraints) };
          }),
        );
      },
    }),
  );

  app.listen(process.env.HTTP_PORT || 5000, () => {
    logger.log(`Running NestJS on ${process.env.HTTP_PORT || 5000}`);
  });
}
bootstrap();
