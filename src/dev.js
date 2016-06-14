import {Router} from 'express';
import {anonEmailLists} from '@financial-times/newsletter-signup';
const router = new Router();

router.get('/subscribed/:email', (req, res, next) => {
	anonEmailLists.call(`/user/${encodeURIComponent(req.params.email)}`, null, 'GET')
	.then(r => r.json())
	.then(j => res.json(j))
	.catch(next);
});

router.get('/barf', (req, res, next) => next(new Error('lol')));

router.get('/fastly-spoor', (req, res) => res.send(req.get('x-spoor-id')));

export default router;
