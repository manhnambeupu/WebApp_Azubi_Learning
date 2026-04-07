"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthException = void 0;
const common_1 = require("@nestjs/common");
class OAuthException extends common_1.HttpException {
    redirectUrl;
    constructor(redirectUrl) {
        super('OAuth Login Failed', common_1.HttpStatus.FOUND);
        this.redirectUrl = redirectUrl;
    }
}
exports.OAuthException = OAuthException;
//# sourceMappingURL=oauth.exception.js.map