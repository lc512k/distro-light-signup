import{Router} from 'express';
import{anonEmailLists} from '@financial-times/newsletter-signup';
const router = new Router();

router.get('/subscribed/:email', (req, res, next) => {
	anonEmailLists.call(`/user/${encodeURIComponent(req.params.email)}`, null, 'GET')
	.then(r => r.json())
	.then(j => res.json(j))
	.catch(next);
});

export default router;
