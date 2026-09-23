export function mockAnswer(r){
 const base={title:'示例论文 · 演示答案',answer:'',terms:[],steps:[],mermaid:''};
 const answers={explain:'作者想让文本分类模型换到新领域时仍然表现稳定。对比学习让相似文本的表示更接近，减少模型对特定领域词汇的依赖。',translate:'我们提出一种对比学习框架，以改善跨领域文本分类的稳定性。\n简单理解：换一批不同领域的文本，模型也应该能正确分类。',terms:'以下是示例论文中的常见术语。',sentence:'主干：We introduce a framework（我们提出一个框架）。\n目的：to improve cross-domain robustness（为了提高跨领域稳定性）。\n理解：作者引入新训练方法，让模型换领域后仍然可靠。',results:'比较对象：普通训练、领域对抗训练和提出的方法。\n指标：F1，越大越好。示例表中 Books 从 78.4 提升到 83.7，增加 5.3 个百分点。\n注意：虚构演示数据，不能作为研究证据。','paper-summary':'研究问题：换领域后文本分类效果下降。\n方法：BERT 编码器结合对比学习。\n数据：三个虚构商品评论领域。\n实验：对比普通训练与领域对抗训练。\n结果：示例数据显示 F1 提升。\n贡献：结合跨领域正负样本训练与一致的评估流程。','experiment-flow':'根据示例论文梳理训练与评估的分支。',question:'这是离线演示模式，不会推理任意问题。示例研究通过对比学习改善跨领域表现；使用 F1 同时考虑查准率和查全率。'};
 base.answer=answers[r.action];
 if(r.action==='terms')base.terms=[{term:'Contrastive learning',translation:'对比学习',simple:'让相似文本靠近，让不同文本远离。',detail:'编码器将文本转换成向量，通过正负样本对优化向量间距离。',technical:'使用温度 τ 调节 softmax 分布，并最小化对比损失。',prerequisites:['Embedding','Softmax']},{term:'Embedding',translation:'向量表示',simple:'用一组数字表示文字的含义。',detail:'编码器把句子映射到高维空间。',technical:'z ∈ R^d；使用余弦相似度比较向量。',prerequisites:[]}];
 if(r.action==='experiment-flow'){
 base.steps=['读取三个评论数据集','分词并划分训练集与测试集','分别训练 Baseline 与对比学习模型','在相同测试集上评估 F1','比较跨领域结果'];
 base.mermaid=r.complexity==='简洁版'?'flowchart TD\n A[数据] --> B[两种训练方法]\n B --> C[F1 评估]\n C --> D[结果比较]':'flowchart TD\n A[Books] --> D[预处理]\n B[Electronics] --> D\n C[DVD] --> D\n D --> E[训练集]\n D --> T[测试集]\n E --> F[Baseline]\n E --> G[BERT 与对比学习]\n F --> H[F1 评估]\n G --> H\n T --> H\n H --> I[比较结果]';
 if(r.complexity==='详细版')base.mermaid+='\n G --> J[投影层]\n J --> K[对比损失]\n K --> H';
 }
 if(r.depth==='example')base.answer+='\n例子：让表达同样情感的书评和电子产品评论靠近，帮助模型识别情感而不是商品名称。';
 if(r.depth==='detail')base.answer+='\n原理补充：通过对比损失优化文本表示。示例未给出置信区间，因此不能据此判断统计显著性。';
 return base;
}
