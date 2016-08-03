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

router.get('/spoor-device-id', (req, res) => {
	const [, spoorId] = /spoor-id=([^;]+)/.exec(req.get('cookie')) || [];
	res.send(spoorId);
});

router.get('/client-barf', (req, res) => res.render('barf'));

export default router;
