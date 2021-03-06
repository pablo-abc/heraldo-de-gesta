import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArticlesModule } from './articles/articles.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { RoleMappingsModule } from './role-mappings/role-mappings.module';
import { AuthModule } from './auth/auth.module';
import { VotesModule } from './votes/votes.module';
const { DB_NAME: dbname, DB_USER: dbuser, DB_HOST: dbhost, DB_PORT: dbport, MONGO_URI: mongoUri } = process.env;
const dburi = mongoUri ? mongoUri : `mongodb://${dbhost}:${dbport}/${dbname}`;

@Module({
  imports: [ArticlesModule, MongooseModule.forRoot(dburi), UsersModule, RolesModule, RoleMappingsModule, AuthModule, VotesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
