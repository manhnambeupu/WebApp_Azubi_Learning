import { QuestionType } from '@prisma/client';
import { CreateAnswerDto } from './create-answer.dto';
export declare class UpdateQuestionDto {
    text?: string;
    explanation?: string;
    imageUrl?: string;
    isPrivate?: boolean;
    type?: QuestionType;
    orderIndex?: number;
    answers?: CreateAnswerDto[];
}
