import {Router} from 'express';

const router = new Router();

router.get('/signup-test', (req, res) => {
	res.render('signup-test');
});

export default router;
