export declare class SubmitMatchDto {
    answerId: string;
    matchText: string;
}
export declare class SubmitAnswerDto {
    questionId: string;
    answerIds: string[];
    matches?: SubmitMatchDto[];
}
