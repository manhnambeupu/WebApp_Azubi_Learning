import { QuestionType } from '@prisma/client';
import { CreateAnswerDto } from './create-answer.dto';
export declare class CreateQuestionDto {
    text: string;
    explanation?: string;
    imageUrl?: string;
    isPrivate?: boolean;
    type: QuestionType;
    answers: CreateAnswerDto[];
}
