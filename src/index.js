import newsletterSignup from '@financial-times/newsletter-signup';
import express from 'express';
import logger from 'morgan';
import expressHandlebars from 'express-handlebars';

import devController from './controllers/dev';

const app = express();
const port = process.env.PORT || 1337;

if(app.get('env') !== 'production') {
	require('longjohn'); // eslint-disable-line global-require
}

app.engine('html', expressHandlebars({
	extname: '.html',
	defaultLayout: 'main',
}));
app.set('view engine', 'html');

app.use(logger(process.env.LOG_FORMAT || (app.get('env') === 'development' ? 'dev' : 'combined')));

app.get('/', (req, res) => res.render('signup'));
app.use('/signup', newsletterSignup);
app.use('/dev', devController);
app.use('/public', express.static('public'));

app.listen(port, () => console.log(`Listening on port ${port}`));
