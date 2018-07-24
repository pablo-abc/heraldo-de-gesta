import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './interfaces/comment.interface';

@Injectable()
export class CommentsService {
    constructor(@InjectModel('Comment') private readonly commentModel: Model<Comment>) { }

    async create(createCommentDto: CreateCommentDto, article?: string): Promise<Comment> {
        const createdComment = article ?
            new this.commentModel(createCommentDto.setArticle(article)) :
            new this.commentModel(createCommentDto);
        return await createdComment.save();
    }

    async findAll(): Promise<Comment[]> {
        return await this.commentModel.find().exec();
    }
}
