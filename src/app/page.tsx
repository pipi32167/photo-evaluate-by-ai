import Head from 'next/head';
import PhotoUpload from '../../components/PhotoUpload';
import './globals.css';

const Home = () => {
    return (
        <div>
            <Head>
                <title>Photo Upload and Analysis</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>
            <main>
                <h1>Photo Analysis</h1>
                <PhotoUpload />
            </main>
        </div>
    );
};

export default Home;
