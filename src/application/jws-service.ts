import jwt from 'jsonwebtoken'
import {UserDBType} from "../types/user-type";
import {settings} from "../settings";
import {jwtBlackList} from "../repositories/jwtBlackList";

export const jwsService = {
    async createJWT(userId: string, timeToExpired: number) {
        return jwt.sign({userId}, settings.JWT_SECRET, {expiresIn: `${timeToExpired}s`})
    },

    async giveUserIdByToken(token: string) {
        try {
            const result: any = await jwt.verify(token, settings.JWT_SECRET)
            return result
        } catch (error) {
            return null
        }
    },

    async addTokenInBlackList(refreshToken: string) {
        return await jwtBlackList.removeRefreshToken(refreshToken)
    },

    async checkTokenInBlackList(refreshToken: string) {
        return await jwtBlackList.giveToken(refreshToken)
    }
}