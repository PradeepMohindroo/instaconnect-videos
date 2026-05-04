import { Router, type IRouter } from "express";
import healthRouter from "./health";
import videosRouter from "./videos";
import widgetsRouter from "./widgets";
import statsRouter from "./stats";
import embedRouter from "./embed";

const router: IRouter = Router();

router.use(healthRouter);
router.use(videosRouter);
router.use(widgetsRouter);
router.use(statsRouter);
router.use(embedRouter);

export default router;
