import newsletterSignup from '@financial-times/newsletter-signup';
import express from 'express';
import logger from 'morgan';

const app = express();
const port = process.env.PORT || 1337;

app.use(logger(process.env.LOG_FORMAT || (app.get('env') === 'development' ? 'dev' : 'combined')));
app.use('/signup', newsletterSignup);

app.listen(port, () => console.log(`Listening on port ${port}`));
