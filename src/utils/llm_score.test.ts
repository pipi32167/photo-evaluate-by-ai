import { correct_total_score, xml_to_markdown, remove_code_block } from './llm_score';

describe('correct_total_score', () => {
    it('should return the original XML if the total score is correct', async () => {
        const xml = `
        <image_review>
            <scoring>
                <composition score="25" max_score="25"/>
                <exposure score="5" max_score="5"/>
                <color score="5" max_score="5"/>
                <detail score="5" max_score="5"/>
                <aesthetic_appeal score="10" max_score="10"/>
                <total_score score="50" max_score="50"/>
            </scoring>
        </image_review>
        `;
        
        const result = await correct_total_score(xml);
        expect(result).toBe(xml);
    });

    it('should correct the total score if it is incorrect', async () => {
        const xml = `
        <image_review>
            <scoring>
                <composition score="20" max_score="25"/>
                <exposure score="4" max_score="5"/>
                <color score="4" max_score="5"/>
                <detail score="4" max_score="5"/>
                <aesthetic_appeal score="8" max_score="10"/>
                <total_score score="45" max_score="50"/>
            </scoring>
        </image_review>
        `;
        
        const expectedXml = `
        <image_review>
            <scoring>
                <composition score="20" max_score="25"/>
                <exposure score="4" max_score="5"/>
                <color score="4" max_score="5"/>
                <detail score="4" max_score="5"/>
                <aesthetic_appeal score="8" max_score="10"/>
                <total_score score="40" max_score="50"/>
            </scoring>
        </image_review>
        `.trim();

        const result = await correct_total_score(xml);
        expect(result).not.toBe(xml);
        expect(result).toContain('<total_score score="40" max_score="50"/>');
    });
});

describe('xml_to_markdown', () => {
    it('should convert XML to markdown correctly', async () => {
        const xml = `
        <image_review>
            <image_description>Sample image description.</image_description>
            <scoring>
                <composition score="20" max_score="25">Good composition.</composition>
                <exposure score="4" max_score="5">Well exposed.</exposure>
                <color score="5" max_score="5">Great colors.</color>
                <detail score="4" max_score="5">Nice details.</detail>
                <aesthetic_appeal score="8" max_score="10">Very appealing.</aesthetic_appeal>
                <total_score score="41" max_score="50"/>
            </scoring>
            <suggestions_for_improvement>Improve lighting.</suggestions_for_improvement>
            <summary>Overall good image.</summary>
        </image_review>
        `;

        const expectedMarkdown = `# Image Review

## Image Description
Sample image description.

## Scoring

| Category         | Score | Max Score | Description                                                                 |
|------------------|-------|-----------|-----------------------------------------------------------------------------|
| Composition      | 20 | 25 | Good composition. |
| Exposure         | 4 | 5 | Well exposed. |
| Color            | 5 | 5 | Great colors. |
| Detail           | 4 | 5 | Nice details. |
| Aesthetic Appeal | 8 | 10 | Very appealing. |
| Total Score      | 41 | 50 | |

## Suggestions for Improvement
Improve lighting.

## Summary
Overall good image.
`;

        const markdown = await xml_to_markdown(xml);
        expect(markdown).toBe(expectedMarkdown);
    });

    it('should cconvert XML to markdown correctly too', async () => {
        const xml = `
<image_review>
  <image_description>
    The photo depicts a female runner in a blue and white running outfit participating in an outdoor running event.  Other runners and a tree-lined environment are visible in the background, with a city skyline faintly visible in the distance. The sun is shining, the leaves show autumnal colors, and there are some fallen leaves on the ground. The runner is in sharp focus, while the background is slightly blurred, creating a depth of field effect.
  </image_description>
  <scoring>
    <composition score="19" max_score="25">The runner is positioned well in the frame, slightly off-center, which is visually appealing. The background is slightly cluttered, but the blur helps to keep the focus on the runner.  The use of leading lines is minimal, but the path does subtly guide the eye towards the runner.  However, the composition could be improved by a more intentional use of negative space.</composition>
    <exposure score="4" max_score="5">The exposure is well-balanced. The runner is brightly lit, and the background is appropriately exposed, preventing overexposure or underexposure.  Details are visible in both the runner and the background.</exposure>
    <color score="4" max_score="5">The colors are vibrant and natural. The blue and white of the runner's outfit contrast nicely with the green of the trees and the autumnal colors of the leaves. The color saturation is appropriate and enhances the overall mood of the image.</color>
    <detail score="3" max_score="5">The detail on the runner is sharp and clear. However, the background details are somewhat lost in the blur, which could be improved for a more comprehensive image. The runner's facial expression is not clearly visible, limiting the emotional connection.</detail>
    <aesthetic_appeal score="7" max_score="10">The image conveys a sense of motion and energy. The bright sunlight and natural setting add to the aesthetic appeal. However, the lack of a clear emotional connection with the runner slightly detracts from the overall impact. A more expressive pose or facial expression from the runner would significantly enhance the aesthetic appeal.</aesthetic_appeal>
    <total_score score="37" max_score="50"/>
  </scoring>
  <suggestions_for_improvement>
* **Composition:** Consider cropping the image to reduce the clutter in the background and create a more balanced composition. Experiment with different angles and perspectives to find a more dynamic composition.  A tighter crop focusing more on the runner could also be beneficial.

* **Detail:**  Try to capture a moment where the runner's facial expression is more visible, conveying emotion and enhancing the storytelling aspect of the photograph.  Consider using a faster shutter speed to freeze the motion and increase sharpness in the background.

* **Aesthetic Appeal:**  Focus on capturing a more decisive moment in the runner's stride or a more expressive facial expression. This will create a stronger emotional connection with the viewer and enhance the overall impact of the image.
  </suggestions_for_improvement>
  <summary>
This is a good action shot capturing the energy of a marathon runner. The exposure, color, and composition are well-executed. However, improvements can be made to the background clutter, the detail of the runner's expression, and the overall composition to create a more impactful and emotionally resonant image.  Focusing on capturing a more decisive moment and a clearer expression from the runner would significantly elevate the photograph.
  </summary>
</image_review>
        `

        const markdown = await xml_to_markdown(xml);
    })
});

describe('remove_code_block', () => {
    it('should remove code block markers from a string', () => {
        const input = '```\ncode here\n```\n';
        const expectedOutput = 'code here';
        expect(remove_code_block(input)).toBe(expectedOutput);
    });

    it('should return the same string if no code block markers are present', () => {
        const input = 'no code block here';
        const expectedOutput = 'no code block here';
        expect(remove_code_block(input)).toBe(expectedOutput);
    });

    it('should handle empty strings', () => {
        const input = '';
        const expectedOutput = '';
        expect(remove_code_block(input)).toBe(expectedOutput);
    });

    it('should handle xml code block', () => {
        const input = "```xml\n<test>hahaha</test>\n```\n";
        const expectedOutput = '<test>hahaha</test>';
        expect(remove_code_block(input)).toBe(expectedOutput);
    });
}); 