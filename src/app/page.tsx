"use client";
import Head from 'next/head';
import PhotoUpload from '@/components/PhotoUpload';
import { useTranslation } from 'react-i18next';
import '@/app/globals.css';
import { Suspense } from 'react';

const Home = () => {
    const { t, i18n } = useTranslation();

    return (
        <Suspense fallback={<div>{t('Loading...')}</div>}>

        <div>
            <Head>
                <title>{t('Photo Upload and Analysis')}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>
            <main>
                <h1>{t('Photo Analysis')}</h1>
                <PhotoUpload />
            </main>
        </div>
        </Suspense>
    );
};

export default Home;
