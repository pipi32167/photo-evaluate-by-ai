import fs from 'fs';
import { OpenAI } from 'openai';
import * as xml2js from 'xml2js';


export function remove_code_block(s: string): string {

  let lines = s.split("\n")
  if (lines[0].trim().startsWith("```")) {
    lines = lines.slice(1, lines.length-2)
    s = lines.join("\n")
  }
  
  return s
}

export async function correct_total_score(xml: string): Promise<string> {
    // console.log('correct_total_score:', xml)
    xml = remove_code_block(xml)

    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xml);

    const scoring = result.image_review.scoring[0];
    const totalScoreElement = scoring.total_score[0];
    const totalScore = parseInt(totalScoreElement.$.score, 10);

    const scores = [
        parseInt(scoring.composition[0].$.score, 10),
        parseInt(scoring.exposure[0].$.score, 10),
        parseInt(scoring.color[0].$.score, 10),
        parseInt(scoring.detail[0].$.score, 10),
        parseInt(scoring.aesthetic_appeal[0].$.score, 10)
    ];

    const calculatedTotalScore = scores.reduce((acc, curr) => acc + curr, 0);

    if (calculatedTotalScore === totalScore) {
      // console.log(`Total score is correct: ${totalScore}`);
      return xml;
    } 
        
    totalScoreElement.$.score = calculatedTotalScore.toString();
    console.log(`Total score corrected from ${totalScore} to ${calculatedTotalScore}`);

    // Convert back to XML if needed
    const builder = new xml2js.Builder();
    const correctedXml = builder.buildObject(result);
    // console.log(correctedXml);
    return correctedXml;
}

export async function xml_to_markdown(xml: string): Promise<string> {
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(xml);

  const imageDescription = result.image_review.image_description[0].trim();
  const scoring = result.image_review.scoring[0];
  const suggestionsForImprovement = result.image_review.suggestions_for_improvement[0].trim();
  const summary = result.image_review.summary[0].trim();

  let markdown = `# Image Review

## Image Description
${imageDescription}

## Scoring

| Category         | Score | Max Score | Description                                                                 |
|------------------|-------|-----------|-----------------------------------------------------------------------------|
| Composition      | ${scoring.composition[0].$.score} | ${scoring.composition[0].$.max_score} | ${scoring.composition[0]._.trim()} |
| Exposure         | ${scoring.exposure[0].$.score} | ${scoring.exposure[0].$.max_score} | ${scoring.exposure[0]._.trim()} |
| Color            | ${scoring.color[0].$.score} | ${scoring.color[0].$.max_score} | ${scoring.color[0]._.trim()} |
| Detail           | ${scoring.detail[0].$.score} | ${scoring.detail[0].$.max_score} | ${scoring.detail[0]._.trim()} |
| Aesthetic Appeal | ${scoring.aesthetic_appeal[0].$.score} | ${scoring.aesthetic_appeal[0].$.max_score} | ${scoring.aesthetic_appeal[0]._.trim()} |
| Total Score      | ${scoring.total_score[0].$.score} | ${scoring.total_score[0].$.max_score} | |

## Suggestions for Improvement
${suggestionsForImprovement}

## Summary
${summary}
`;

  // console.log(markdown);
  return markdown;
}

async function evaluate_by_vlm(image_path: string, lang: string): Promise<string> {
    // Initialize OpenAI client
    const openai = new OpenAI({
      baseURL: process.env.OPENAI_API_BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
      defaultHeaders: {"x-foo": "true"},
  });

  // Read and encode image
  const imageBuffer = fs.readFileSync(image_path);
  const base64Image = imageBuffer.toString('base64');
  // console.log('lang:', lang)

  const prompt = `
<instruction>
你是一个摄影大师，你擅长从构图、曝光、色彩、细节、美感五个方面评估摄影作品。每个方面都包含若干子项，并赋予权重，最终得出总分。输出格式按照output_format和提供的例子来输出xml。

- 构图 (25分):  评估主体位置、背景、层次感、对称性、线条和黄金分割的运用。
  - 主体位置: 主体是否位于最佳位置，是否符合视觉中心或黄金分割原则。
  - 背景: 背景是否简洁明了，是否与主体和谐统一，是否起到衬托作用。
  - 层次感: 画面层次是否丰富，景深是否合理运用。
  - 对称性: 是否运用对称构图，对称性是否和谐。
  - 线条:  线条的运用是否引导视线，是否增强画面的动感或稳定性。
- 曝光 (5分): 评估亮度、阴影和光线的控制。
  - 亮度:  亮度是否恰当，是否避免过曝或欠曝。
  - 阴影: 阴影的运用是否恰当，是否增强画面的立体感和氛围。
  - 光线: 光线的运用是否恰当，是否突出主体，是否营造氛围。
- 色彩 (5分):  评估色调、饱和度和色彩搭配。
  - 色调:  色调是否和谐统一，是否符合主题和氛围。黑白照片则评估灰阶的运用和光影的对比。
  - 饱和度: 饱和度是否恰当，是否符合主题和氛围。
  - 色彩搭配:  色彩搭配是否和谐，是否具有视觉冲击力。
- 细节 (5分): 评估清晰度、纹理和对比度。
  - 清晰度:  画面清晰度是否足够，细节是否清晰可见。
  - 纹理:  纹理的细节是否清晰，是否增强画面的质感。
  - 对比度: 对比度是否恰当，是否增强画面的视觉冲击力。
- 美感 (10分): 评估唤起情感、视觉冲击力、故事性和创意。
  - 唤起情感: 照片是否能引发观者的情感共鸣。
  - 视觉冲击力: 照片的视觉效果是否强烈，是否具有吸引力。
  - 故事性: 照片是否具有故事性，是否能引发观者的想象力。
  - 创意: 照片的创意性是否独特，是否具有新颖性。例如：独特的视角、构图、后期处理等。

使用 ${lang} 语言来回答，并提供改进建议。

</instruction>
<output_format>
  <image_review>
    <image_description>[image_description: text]</image_description>
    <scoring>
      <composition score="[score: number]" max_score="25">[composition: text]</composition>
      <exposure score="[score: number]" max_score="5">[exposure: text]</exposure>
      <color score="[score: number]" max_score="5">[color: text]</color>
      <detail score="[score: number]" max_score="5">[detail: text]</detail>
      <aesthetic_appeal score="[score: number]" max_score="10">[aesthetic_appeal: text]</aesthetic_appeal>
      <total_score score="[score: number]" max_score="50"/>
    </scoring>
    <suggestions_for_improvement>[suggestions_for_improvement: markfown format]</suggestions_for_improvement>
    <summary>[summary: markdown format]</summary>
  </image_review>
</output_format>
<output_example1>
<image_review>
  <image_description>
    这张照片是近距离拍摄的一只欧洲野兔（Lepus europaeus）的侧面图像。野兔的身体呈现出柔软的棕色色调，毛发细致，耳朵高耸，眼睛饱满。野兔的左耳稍微倾斜，似乎在倾听什么。它的嘴巴张开，舌头伸出，似乎在品尝某种东西。
  </image_description>
  <scoring>
    <composition score="20" max_score="25">照片的构图很好，野兔的侧面图像清晰可见，背景模糊不干扰主体。然而，野兔的左耳略微倾斜，可能是由于摄影师的姿势或野兔的自然姿势导致的。</composition>
    <exposure score="3" max_score="5">照片的曝光很好，野兔的细节清晰，色彩自然。然而，背景略微过暗，可能是由于曝光不足导致的。</exposure>
    <color score="4" max_score="5">照片的色彩很自然，野兔的棕色色调和背景的灰色色调很匹配。然而，野兔的眼睛和舌头略微偏黄，可能是由于摄影师的颜色校正不足导致的。</color>
    <detail score="4" max_score="5">照片的细节很清晰，野兔的毛发、耳朵、眼睛和舌头都很清晰可见。然而，背景略微模糊，不太清晰。</detail>
    <aesthetic_appeal score="9" max_score="10">照片的美感很好，野兔的侧面图像很动人，耳朵和眼睛很可爱。然而，背景略微过暗，可能是由于曝光不足导致的。</aesthetic_appeal>
    <total_score score="40" max_score="50"/>
  </scoring>
  <suggestions_for_improvement>
**曝光改进**: 建议使用合适的曝光补偿，适当提高背景的曝光度以获得更明亮的背景。
  </suggestions_for_improvement>
  <summary>
这张照片很好，构图、曝光、色彩、细节和美感都很出色。然而，背景略微过暗，可能是由于曝光不足导致的。建议摄影师在下次拍摄时注意曝光和背景的设置。
  </summary>
</image_review>
</output_example1>
<output_example2>
<image_review>
  <image_description>
这幅照片呈现了一幅壮观的山脉景观，背景是温暖的夕阳，照亮了雪峰的顶端。雪峰的光芒照射下，山顶的雪崖和冰川闪闪发光，像是一颗璀璨的宝石。照片的主体是远处的雪峰，高耸入云，雪峰的顶端被夕阳的光芒照亮，形成一个金色的光环。下方的云层弥漫在山谷中，形成一片柔和的白色。照片的前景是一个静止的湖泊，反映了雪峰的倒影，形成一个完美的镜像效果。
  </image_description>
  <scoring>
    <composition score="25" max_score="25">照片的构图非常好，雪峰的主体位置很好，背景的云层和湖泊的前景都很自然地融入了整个场景。</composition>
    <exposure score="5" max_score="5">照片的曝光非常好，雪峰的光照非常均匀，阴影和光照的对比很好。</exposure>
    <color score="5" max_score="5">照片的色彩非常丰富，雪峰的金色光环非常漂亮，云层的白色和湖泊的反映都很自然。</color>
    <detail score="5" max_score="5">照片的细节非常好，雪峰的纹理和云层的层次都很清晰。</detail>
    <aesthetic_appeal score="10" max_score="10">照片的美感非常强烈，雪峰的壮观景观和夕阳的光芒都让人感到非常震撼。</aesthetic_appeal>
    <total_score score="50" max_score="50"/>
  </scoring>
  <suggestions_for_improvement>
1. **细节改进**: 稍微增加一些景物的层次感，例如增加一些树木或其他自然元素来丰富整个场景。
  </suggestions_for_improvement>
  <summary>
照片非常好，构图、曝光、色彩、细节和美感都非常出色。唯一的建议是，照片中可以稍微增加一些景物的层次感，例如增加一些树木或其他自然元素来丰富整个场景。
  </summary>
</image_review>
</output_example2>
<output_example3>
<image_review>
  <image_description>
    这张照片显示了一张办公桌的局部视图，背景是混乱的办公室环境。主角是一台黑色维克斯的液晶显示器，显示着一段编程代码的文本编辑器。显示器下方的桌面上放置了一些电子设备，包括一个黑色手机、一个绿色水壶、一个白色水壶盖和一些杂乱的电缆。图像中显示器占据了主要视觉焦点，桌面的其他元素围绕着它展开，形成了一个清晰的层次结构。然而，图像中一些元素的排列感觉不够谨慎，例如绿色水壶和白色水壶盖的位置感觉有些杂乱。
  </image_description>
  <scoring>
    <composition score="0" max_score="25">图像中内容杂乱，没有明确的主体，构图混乱。</composition>
    <exposure score="3" max_score="5">照片的曝光正常，显示器和桌面上的元素都清晰可见。</exposure>
    <color score="3" max_score="5">照片的色彩非常自然，但是构图和细节方面有待改进。</color>
    <detail score="3" max_score="5">照片的细节正常，但是构图和色彩方面有待改进。</detail>
    <aesthetic_appeal score="0" max_score="10">照片缺乏美感，构图、色彩和细节方面有待改进。</aesthetic_appeal>
    <total_score score="9" max_score="50"/>
  </scoring>
  <suggestions_for_improvement>
    **构图改进**: 整理桌面，确定拍摄的焦点。
    **细节改进**: 整理桌面，不要显得凌乱不堪。
    **创意改进**: 整理桌面，选择你要拍摄的重点，围绕着这个重点进行思考。
    **美感改进**: 整理桌面，选择你要拍摄的重点，围绕着这个重点进行美感的调整。
  </suggestions_for_improvement>
  <summary>
    总体来说，这张照片的构图、美感和创意方面有待改进，建议摄影师在下次拍摄时注意构图和色彩的搭配，突出主题，增加一些视觉吸引力和创意元素。
  </summary>
</image_review>
</output_example3>
<output_example4>
<image_review>
  <image_description>
    这张照片拍摄的是一位跑步者，穿着蓝色和白色的运动服，正在参加一场户外跑步活动。背景中可以看到其他跑步者和绿树成荫的环境，远处隐约可见城市的天际线。阳光明媚，树叶呈现出秋天的色彩，地面上有些许落叶。
  </image_description>
  <scoring>
    <composition score="18" max_score="25">主体明确，跑步者位于画面的中心位置，背景的树木和其他跑步者增加了层次感。但前景的灌木略显多余。</composition>
    <exposure score="4" max_score="5">光线充足，主体和背景的曝光都很均匀，细节清晰可见。</exposure>
    <color score="4" max_score="5">色彩鲜明，蓝色和白色的运动服在绿色背景中很突出，整体色调自然。</color>
    <detail score="1" max_score="5">主体的细节表现良好，但背景略显杂乱，稍微影响了整体的清晰度。主体跑步者没有看向镜头，缺少情感表达。</detail>
    <aesthetic_appeal score="3" max_score="10">画面充满活力，阳光和自然环境增添了美感，主体跑步者没有看向镜头，缺少美感。</aesthetic_appeal>
    <total_score score="30" max_score="50"/>
  </scoring>
  <suggestions_for_improvement>
**细节改进**: 注意捕捉主体角色的表情，没有看向镜头没有关系，但是应该有意义和情绪感染力，比如思考、快乐、痛苦等。
  </suggestions_for_improvement>
  <summary>
这张照片整体表现一般，构图和色彩都很出色，展现了运动的活力和户外的自然美景。建议在拍摄时注意捕捉主体角色的动作表情，更有情绪感染力。
  </summary>
</image_review>
</output_example4>
<output_example5>
<image_review>
  <image_description>
    这张照片展示了一条河流的景色。河流的水面平静，水面上漂浮着一些落叶，显示出季节的变化。河岸两侧有绿化带，种植了树木和灌木，为画面增添了自然的美感。右侧的河岸边有一座建筑物，建筑物的设计现代，外墙有大块的玻璃窗，反射出天空和周围的景色。远处可以看到一些高楼大厦，显示出这是一个城市的环境。天空晴朗，云朵稀疏，阳光明媚，整个画面给人一种宁静和舒适的感觉。
  </image_description>
  <scoring>
    <composition score="10" max_score="25">照片的构图很好，河流的曲线引导视线，两侧的绿化带和建筑物形成了一个平衡的画面。然而，占据视觉主体的河流较为单调，缺少视觉焦点，构图不佳。</composition>
    <exposure score="4" max_score="5">照片的曝光良好，光线充足，细节清晰。然而，建筑物的玻璃窗反射出一些亮光，可能是因为光线过强导致的。</exposure>
    <color score="4" max_score="5">照片的色彩自然，河流的绿色和落叶的黄色形成了对比，增加了画面的层次感。然而，建筑物的玻璃窗反射出的亮光可能会影响色彩的平衡。</color>
    <detail score="4" max_score="5">照片的细节清晰，河流的纹理、落叶、树木和建筑物的细节都表现得很好。然而，建筑物的玻璃窗反射出的亮光可能会影响细节的表现。</detail>
    <aesthetic_appeal score="4" max_score="10">照片的构图影响了美感，缺少视觉焦点和情感表达，整体感觉较为平淡。</aesthetic_appeal>
    <total_score score="26" max_score="50"/>
  </scoring>
  <suggestions_for_improvement>
1. **构图改进**: 河流占据比例过大，不符合黄金比例，容易让观看者失去焦点，建议减少河流比例至三分之一，露出更多天空和建筑的细节。
2. **美感改进**: 河流占据比例过大，不符合黄金比例，容易让观看者失去焦点，建议减少河流比例至三分之一。
  </suggestions_for_improvement>
  <summary>
这张照片整体表现不佳，构图和美感方面有待改进，建议摄影师在下次拍摄时注意构图的平衡和色彩的搭配，增加画面的层次感和视觉焦点。
  </summary>
</image_review>
</output_example5>    
  `

  // console.log('prompt:\n', prompt)

  // Call OpenAI API
  const response = await openai.chat.completions.create({
      
      model: process.env.OPENAI_API_MODEL || 'gpt-4o-mini',
      messages: [
          {
              role: "user",
              content: [
                  {
                      type: "text",
                      text: prompt,
                  },
                  {
                      type: "image_url",
                      image_url: {
                          url: `data:image/jpeg;base64,${base64Image}`
                      }
                  }
              ]
          }
      ],
      max_tokens: 2048,
      temperature: 0.1,
  });

  return response.choices[0].message.content!!;
}

export async function photo_evaluate({ image_path, lang }: { image_path: string, lang: string }) {
  
  let result = await evaluate_by_vlm(image_path, lang)
  result = await correct_total_score(result)
  return await xml_to_markdown(result)
}
