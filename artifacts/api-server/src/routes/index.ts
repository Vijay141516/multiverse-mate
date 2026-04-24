import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chessRouter from "./chess";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/chess", chessRouter);

export default router;
