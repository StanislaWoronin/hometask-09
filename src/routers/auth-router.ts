import {Request, Response, Router} from "express";
import {v4 as uuidv4} from "uuid";
import {authService} from "../domain/auth-service";
import {securityService} from "../domain/security-service";
import {jwsService} from "../application/jws-service";
import {usersService} from "../domain/user-service";
import {getAuthRouterMiddleware,
        postAuthRouterMiddleware,
        postRegistrationMiddleware,
        postResendingRegistrationEmailMiddleware} from "../middlewares/authRouter-middleware";
import {refreshTokenValidation} from "../middlewares/validation-middleware/refreshToken-validation";
import {createToken} from "../helperFunctions";
import {ipAddressLimiter} from "../middlewares/validation-middleware/ipAddressLimiter";


export const authRouter = Router({})

authRouter.post('/login',
    postAuthRouterMiddleware,
    async (req: Request, res: Response) => {
        const deviceId = uuidv4()
        const token = await createToken(req.user!.id, deviceId)
        const tokenPayload = await jwsService.giveTokenPayload(token.refreshToken)

        await securityService.createUserDevice(tokenPayload, req.ip) // can check and send 404

        //console.log('----->> refreshToken', token.refreshToken)
        return res.status(200)
            .cookie('refreshToken', token.refreshToken, {secure: true, httpOnly: true})
            .send({accessToken: token.accessToken})
    }
)

authRouter.post('/registration',
    postRegistrationMiddleware,
    async (req: Request, res: Response) => {
        await authService.createUser(req.body.login, req.body.password, req.body.email, req.ip)

        return res.sendStatus(204)
    }
)

authRouter.post('/registration-confirmation',
    ipAddressLimiter,
    async (req: Request, res: Response) => {
        const emailConfirmed = await authService.confirmEmail(req.body.code)

        if (!emailConfirmed) {
            return res.status(400)
                .send({errorsMessages: [{ message: 'Bad Request', field: "code" }]})
        }

        return res.sendStatus(204)
    }
)

authRouter.post('/registration-email-resending',
    ...postResendingRegistrationEmailMiddleware,
    async (req: Request, res: Response) => {
        const result = await authService.resendConfirmRegistration(req.body.email)

        if (!result) {
            return res.status(400)
                .json({ errorsMessages: [{ message: 'Wrong email', field: "email" }] }) // TODO ??? ?????????????? send ???? json ?? ?????????? ?????????? ??????????????????
        }

        return res.sendStatus(204)
    }
)

authRouter.post('/refresh-token',
    refreshTokenValidation,
    async (req: Request, res: Response) => {
        const token = await securityService.createNewRefreshToken(req.cookies.refreshToken, req.body.tokenPayload)

        return res.status(200)
            .cookie('refreshToken', token.refreshToken, {secure: true, httpOnly: true})
            .send({accessToken: token.accessToken})
    }
)

authRouter.post('/logout',
    refreshTokenValidation,
    async (req: Request, res: Response) => {
        await securityService.logoutFromCurrentSession(req.cookies.refreshToken)

        return res.sendStatus(204)
    }
)

authRouter.get('/me',
    getAuthRouterMiddleware,
    async (req: Request, res: Response) => {
        const aboutMe = await usersService.aboutMe(req.user!)

        return res.status(200).send(aboutMe)
    }
)