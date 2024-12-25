// // src/components/Gallery.test.tsx
// import React from 'react';
// import { render, fireEvent, waitFor } from '@testing-library/react';
// import Gallery from './Gallery';
// import { useTranslation } from 'react-i18next';
// import html2canvas from 'html2canvas';

// jest.mock('react-i18next', () => ({
//   useTranslation: () => ({
//     t: (key) => key,
//     i18n: { language: 'en' },
//   }),
// }));

// jest.mock('html2canvas', () => jest.fn());

// global.fetch = jest.fn(() =>
//   Promise.resolve({
//     ok: true,
//     json: () => Promise.resolve({ result: '## Analysis Result' }),
//   })
// );

// describe('Gallery', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   test('renders the component', () => {
//     const { getByText } = render(<Gallery />);
//     expect(getByText('selectAndAnalyzePhoto')).toBeInTheDocument();
//   });

//   test('handles file input change', () => {
//     const { getByText, getByLabelText } = render(<Gallery />);
//     const fileInput = getByLabelText('selectAndAnalyzePhoto');
//     const file = new File(['dummy content'], 'example.png', { type: 'image/png' });

//     fireEvent.change(fileInput, { target: { files: [file] } });

//     expect(getByText('analyzing')).toBeInTheDocument();
//   });

//   test('uploads a photo', async () => {
//     const { getByText, getByLabelText } = render(<Gallery />);
//     const fileInput = getByLabelText('selectAndAnalyzePhoto');
//     const file = new File(['dummy content'], 'example.png', { type: 'image/png' });

//     fireEvent.change(fileInput, { target: { files: [file] } });

//     await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
//     expect(getByText('analysisResult')).toBeInTheDocument();
//   });

//   test('handles errors during upload', async () => {
//     global.fetch.mockImplementationOnce(() =>
//       Promise.reject(new Error('Network Error'))
//     );

//     const { getByText, getByLabelText } = render(<Gallery />);
//     const fileInput = getByLabelText('selectAndAnalyzePhoto');
//     const file = new File(['dummy content'], 'example.png', { type: 'image/png' });

//     fireEvent.change(fileInput, { target: { files: [file] } });

//     await waitFor(() => expect(getByText('errorAnalyzingPhoto')).toBeInTheDocument());
//   });

//   test('navigates between photos', () => {
//     const { getByText, getByLabelText } = render(<Gallery />);
//     const fileInput = getByLabelText('selectAndAnalyzePhoto');
//     const file1 = new File(['dummy content'], 'example1.png', { type: 'image/png' });
//     const file2 = new File(['dummy content'], 'example2.png', { type: 'image/png' });

//     fireEvent.change(fileInput, { target: { files: [file1, file2] } });

//     fireEvent.click(getByText('next'));
//     expect(getByText('analyzing')).toBeInTheDocument();

//     fireEvent.click(getByText('prev'));
//     expect(getByText('analyzing')).toBeInTheDocument();
//   });

//   test('generates QR code and shares', async () => {
//     html2canvas.mockImplementation(() => Promise.resolve(document.createElement('canvas')));

//     const { getByText, getByLabelText } = render(<Gallery />);
//     const fileInput = getByLabelText('selectAndAnalyzePhoto');
//     const file = new File(['dummy content'], 'example.png', { type: 'image/png' });

//     fireEvent.change(fileInput, { target: { files: [file] } });

//     await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
//     fireEvent.click(getByText('share'));

//     await waitFor(() => expect(html2canvas).toHaveBeenCalledTimes(1));
//   });
// });