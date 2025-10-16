import { Module } from "@nestjs/common";
import { AppController } from "./routes.js";
@Module({
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
