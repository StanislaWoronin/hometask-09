import jwt from 'jsonwebtoken'
import {settings} from "../settings";
import {jwtBlackList} from "../repositories/jwtBlackList";

export const jwsService = {
    //TODO добавить юзер айди в пэйлоад
    async createJWT(deviceId: string, timeToExpired: number) {
        return jwt.sign({deviceId}, settings.JWT_SECRET, {expiresIn: `${timeToExpired}s`})
    },

    async giveDeviceInfoByToken(token: string) {
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