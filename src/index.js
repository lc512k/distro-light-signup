import newsletterSignup from '@financial-times/newsletter-signup';
import express from 'express';

const app = express();

app.use('/signup', newsletterSignup);

app.listen(process.env.PORT || 1337);
