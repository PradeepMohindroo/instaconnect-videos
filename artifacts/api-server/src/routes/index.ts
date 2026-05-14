import { Router, type IRouter } from "express";
import healthRouter from "./health";
import videosRouter from "./videos";
import widgetsRouter from "./widgets";
import statsRouter from "./stats";
import embedRouter from "./embed";
import shopifyRouter from "./shopify";

const router: IRouter = Router();

router.use(healthRouter);
router.use(videosRouter);
router.use(widgetsRouter);
router.use(statsRouter);
router.use(embedRouter);
router.use(shopifyRouter);

export default router;
