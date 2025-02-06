import { correct_total_score, xml_to_markdown, remove_code_block } from './llm_score';
import { get_section } from './xml';

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

        // const expectedXml = `
        // <image_review>
        //     <scoring>
        //         <composition score="20" max_score="25"/>
        //         <exposure score="4" max_score="5"/>
        //         <color score="4" max_score="5"/>
        //         <detail score="4" max_score="5"/>
        //         <aesthetic_appeal score="8" max_score="10"/>
        //         <total_score score="40" max_score="50"/>
        //     </scoring>
        // </image_review>
        // `.trim();

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

        await xml_to_markdown(xml);
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

describe('get_section', () => {
    it('should get section correctly', () => {
        const input = `
        haha1
        <test>haha2</test>
        haha3
        `;
        const expectedOutput = "<test>haha2</test>";
        expect(get_section(input, 'test', true)).toBe(expectedOutput);
    });
});

describe('xml_to_markdown', () => {
    it("should get markdown correctly", async () => {
        const xml = `<image_review>
  <image_description>
    这张照片展示了著名的好牧羊人教堂，它坐落在一个开阔的草地上，背景是壮丽的日落天空和远处的山脉。教堂由石头砌成，拥有一个标志性的尖顶。通往教堂的路径由碎石铺成，两侧是低矮的石墙和金属栅栏。前景中生长着茂盛的金色草丛，为画面增添了自然的质感。天空呈现出迷人的色彩渐变，从顶部的深蓝色过渡到地平线附近的粉红色和橙色，预示着日落时分。
  </image_description>
  <scoring>
    <composition score="22" max_score="25">主体位置良好，教堂位于画面右侧，符合三分法原则，并留有足够的空间展现背景的壮丽景色。背景简洁，日落的天空和远山有效地衬托了教堂。画面具有一定的层次感，前景的草地、中景的教堂和远景的山脉依次展开。对称性方面，教堂本身具有一定的对称结构。通往教堂的路径和栅栏形成了一些引导视线的线条，将观众的目光引向主体。</composition>
    <exposure score="4" max_score="5">照片的亮度恰当，天空和地面的细节都得到了保留，没有明显的过曝或欠曝。阴影部分在教堂的背光面，增强了画面的立体感。光线柔和，是典型的日落时分的自然光，营造了宁静祥和的氛围。</exposure>
    <color score="5" max_score="5">色调和谐统一，天空的蓝色、粉色和橙色与地面草地的金色形成了美丽的对比，符合日落的主题。饱和度适中，色彩鲜明但不失自然。色彩搭配非常出色，天空的暖色调与教堂的冷色调相互映衬，视觉冲击力强。</color>
    <detail score="4" max_score="5">画面清晰度足够，教堂的石块纹理、草地的细节以及远处山脉的轮廓都清晰可见。纹理表现良好，石墙、草地和天空的质感都得到了体现。对比度适中，增强了画面的视觉冲击力，但可能在某些阴影区域损失了一些细节。</detail>
    <aesthetic_appeal score="9" max_score="10">照片能够唤起观者对宁静、祥和以及自然之美的感受。日落的色彩和教堂的静谧感营造了强烈的视觉冲击力。照片具有一定的故事性，让人联想到在美丽的自然环境中祈祷和冥想的场景。构图和光线的运用都展现了摄影师的创意。</aesthetic_appeal>
    <total_score score="44" max_score="50"/>
  </scoring>
  <suggestions_for_improvement>
* **构图改进**: 可以尝试略微调整拍摄角度，例如稍微降低机位，以更突出前景草地的纹理，或者稍微向左移动，让教堂更符合黄金分割的交点。
* **细节改进**:  在后期处理时，可以稍微提亮阴影部分，以展现更多教堂背光面的细节，但要注意保持画面的自然感。
  </suggestions_for_improvement>
  <summary>
这张照片是一幅优秀的风景摄影作品，成功地捕捉到了好牧羊人教堂在日落时分的宁静和美丽。构图合理，色彩迷人，曝光恰当，细节清晰，具有很强的审美价值。摄影师巧妙地利用了自然光线和周围环境，创造出一幅令人印象深刻的画面。虽然已经很出色，但仍有一些细微之处可以进一步提升，例如更精细的构图调整和阴影细节的优化。
  </summary>
</image_review>`
        xml_to_markdown(xml)
    })
})