import Head from 'next/head';
import PhotoUpload from '@/components/PhotoUpload';
import '@/app/globals.css';
import { Suspense } from 'react';

const Home = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>

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
        </Suspense>
    );
};

export default Home;
