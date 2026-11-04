# -*- coding: utf-8 -*-
"""Grammar material for each HSK rung.

Served through /api/ladder and rendered as collapsible notes under the rungs.
The patterns are ordered by rung, not by textbook chapter: each one is a tool
you can use immediately with the vocabulary already in the archive.
"""
from __future__ import annotations

HSK_MATERIAL = {
    1: [
        {"pattern": "是", "title": "A is B",
         "body": "Use 是 to link two nouns. It does not link a noun to an adjective: say 我很好, not 我是好.",
         "examples": [
             {"hanzi": "我是学生。", "pinyin": "Wǒ shì xuésheng.", "en": "I am a student."},
             {"hanzi": "这是我的书。", "pinyin": "Zhè shì wǒ de shū.", "en": "This is my book."},
         ]},
        {"pattern": "很 + adjective", "title": "Bare adjectives need a marker",
         "body": "A plain adjective sounds like a comparison. 很 fills the slot and usually means no more than 'is'.",
         "examples": [
             {"hanzi": "今天很冷。", "pinyin": "Jīntiān hěn lěng.", "en": "It is cold today."},
             {"hanzi": "这个苹果很小。", "pinyin": "Zhège píngguǒ hěn xiǎo.", "en": "This apple is small."},
         ]},
        {"pattern": "吗", "title": "Yes/no questions",
         "body": "Add 吗 at the end. Word order does not change. Answer with the verb, not with 'yes' or 'no'.",
         "examples": [
             {"hanzi": "你忙吗？", "pinyin": "Nǐ máng ma?", "en": "Are you busy?"},
             {"hanzi": "他是老师吗？", "pinyin": "Tā shì lǎoshī ma?", "en": "Is he a teacher?"},
         ]},
        {"pattern": "有", "title": "Have and there is",
         "body": "有 covers possession and existence. Negate it with 没, never with 不.",
         "examples": [
             {"hanzi": "我有一个问题。", "pinyin": "Wǒ yǒu yí ge wèntí.", "en": "I have a question."},
             {"hanzi": "桌上没有书。", "pinyin": "Zhuō shàng méiyǒu shū.", "en": "There are no books on the table."},
         ]},
        {"pattern": "的", "title": "Possession and description",
         "body": "的 links a possessor to a noun, or turns a phrase into a description. Family and close ties often drop it.",
         "examples": [
             {"hanzi": "我的手机在这里。", "pinyin": "Wǒ de shǒujī zài zhèlǐ.", "en": "My phone is here."},
             {"hanzi": "好看的衣服。", "pinyin": "Hǎokàn de yīfu.", "en": "Good-looking clothes."},
         ]},
        {"pattern": "在 + place", "title": "Location",
         "body": "在 comes before the place, and the place comes before the verb: 我在家吃饭.",
         "examples": [
             {"hanzi": "我在学校。", "pinyin": "Wǒ zài xuéxiào.", "en": "I am at school."},
             {"hanzi": "他在家看书。", "pinyin": "Tā zài jiā kàn shū.", "en": "He reads at home."},
         ]},
        {"pattern": "了", "title": "Completed action",
         "body": "了 marks completion, not past tense. A future sentence can still take 了 once the action is seen as finished.",
         "examples": [
             {"hanzi": "我吃了饭。", "pinyin": "Wǒ chī le fàn.", "en": "I have eaten."},
             {"hanzi": "明天我买了书就回家。", "pinyin": "Míngtiān wǒ mǎi le shū jiù huíjiā.", "en": "Tomorrow, once I have bought the book, I go home."},
         ]},
    ],
    2: [
        {"pattern": "因为……所以……", "title": "Cause and result",
         "body": "Chinese often keeps both halves. 因为 introduces the reason, 所以 the result. Either half can be dropped in speech.",
         "examples": [
             {"hanzi": "因为下雨，所以我没去。", "pinyin": "Yīnwèi xiàyǔ, suǒyǐ wǒ méi qù.", "en": "Because it rained, I did not go."},
             {"hanzi": "他病了，所以没来。", "pinyin": "Tā bìng le, suǒyǐ méi lái.", "en": "He was ill, so he did not come."},
         ]},
        {"pattern": "虽然……但是……", "title": "Concession",
         "body": "虽然 admits the obstacle; 但是 or 可是 answers it. Do not translate both words separately into English.",
         "examples": [
             {"hanzi": "虽然很累，但是我很高兴。", "pinyin": "Suīrán hěn lèi, dànshì wǒ hěn gāoxìng.", "en": "Although I am tired, I am happy."},
             {"hanzi": "虽然下雨，我们还是去了。", "pinyin": "Suīrán xiàyǔ, wǒmen háishi qù le.", "en": "Although it rained, we still went."},
         ]},
        {"pattern": "还是 / 或者", "title": "Choosing and offering",
         "body": "Questions use 还是 for 'or'. Statements use 或者. Mixing them changes the sentence type.",
         "examples": [
             {"hanzi": "你喝茶还是咖啡？", "pinyin": "Nǐ hē chá háishì kāfēi?", "en": "Do you drink tea or coffee?"},
             {"hanzi": "明天或者后天都可以。", "pinyin": "Míngtiān huòzhě hòutiān dōu kěyǐ.", "en": "Tomorrow or the day after both work."},
         ]},
        {"pattern": "正在 + verb", "title": "Action in progress",
         "body": "正在 before the verb marks what is happening now. 在 alone does the same job in speech.",
         "examples": [
             {"hanzi": "我正在做饭。", "pinyin": "Wǒ zhèngzài zuòfàn.", "en": "I am cooking right now."},
             {"hanzi": "他在打电话。", "pinyin": "Tā zài dǎ diànhuà.", "en": "He is on the phone."},
         ]},
        {"pattern": "比", "title": "Comparison",
         "body": "A 比 B + adjective. Do not add 很 after 比. Use 一点 for a small difference and 得多 for a large one.",
         "examples": [
             {"hanzi": "他比我高。", "pinyin": "Tā bǐ wǒ gāo.", "en": "He is taller than me."},
             {"hanzi": "今天比昨天冷得多。", "pinyin": "Jīntiān bǐ zuótiān lěng de duō.", "en": "Today is much colder than yesterday."},
         ]},
        {"pattern": "动词 + 过", "title": "Have experienced",
         "body": "过 after the verb marks an experience at some point in life. 了 marks a completed event; 过 marks a lived one.",
         "examples": [
             {"hanzi": "我去过北京。", "pinyin": "Wǒ qù guo Běijīng.", "en": "I have been to Beijing."},
             {"hanzi": "他吃过这种东西。", "pinyin": "Tā chī guo zhè zhǒng dōngxi.", "en": "He has eaten this kind of thing before."},
         ]},
        {"pattern": "要……了", "title": "About to happen",
         "body": "要 before the verb and 了 at the end mark an event on the near edge of happening.",
         "examples": [
             {"hanzi": "火车要到了。", "pinyin": "Huǒchē yào dào le.", "en": "The train is about to arrive."},
             {"hanzi": "天要下雨了。", "pinyin": "Tiān yào xiàyǔ le.", "en": "It is about to rain."},
         ]},
    ],
    3: [
        {"pattern": "把", "title": "Handling a specific object",
         "body": "把 moves a known object before the verb to show what happens to it. The verb must carry a result: 把书放在桌上.",
         "examples": [
             {"hanzi": "请把门关上。", "pinyin": "Qǐng bǎ mén guānshàng.", "en": "Please close the door."},
             {"hanzi": "他把作业做完了。", "pinyin": "Tā bǎ zuòyè zuòwán le.", "en": "He finished the homework."},
         ]},
        {"pattern": "被", "title": "Passive",
         "body": "被 marks the doer of an action that affects the subject. It often carries an unwanted result, though not always.",
         "examples": [
             {"hanzi": "我的手机被偷了。", "pinyin": "Wǒ de shǒujī bèi tōu le.", "en": "My phone was stolen."},
             {"hanzi": "他被老师批评了。", "pinyin": "Tā bèi lǎoshī pīpíng le.", "en": "He was criticised by the teacher."},
         ]},
        {"pattern": "越来越 + adjective", "title": "More and more",
         "body": "越来越 marks a steady change. The adjective follows it directly.",
         "examples": [
             {"hanzi": "天气越来越冷了。", "pinyin": "Tiānqì yuèláiyuè lěng le.", "en": "The weather is getting colder and colder."},
             {"hanzi": "他的汉语越来越好。", "pinyin": "Tā de Hànyǔ yuèláiyuè hǎo.", "en": "His Chinese is getting better and better."},
         ]},
        {"pattern": "如果……就……", "title": "If and then",
         "body": "如果 opens a condition; 就 opens the consequence. Do not add 会 unless you mean a future possibility.",
         "examples": [
             {"hanzi": "如果下雨，我们就不去。", "pinyin": "Rúguǒ xiàyǔ, wǒmen jiù bú qù.", "en": "If it rains, we will not go."},
             {"hanzi": "如果你有时间，就来看看。", "pinyin": "Rúguǒ nǐ yǒu shíjiān, jiù lái kànkan.", "en": "If you have time, come and see."},
         ]},
        {"pattern": "除了……以外", "title": "Except for; besides",
         "body": "除了 X 以外 can exclude X or include it. 都 signals exclusion; 也 signals addition.",
         "examples": [
             {"hanzi": "除了他以外，大家都来了。", "pinyin": "Chúle tā yǐwài, dàjiā dōu lái le.", "en": "Everyone came except him."},
             {"hanzi": "除了汉语，我也会说英语。", "pinyin": "Chúle Hànyǔ, wǒ yě huì shuō Yīngyǔ.", "en": "Besides Chinese, I can also speak English."},
         ]},
        {"pattern": "是……的", "title": "Highlighting a detail",
         "body": "是……的 frames a past event around its time, place or manner. The event is already known; the frame answers a detail.",
         "examples": [
             {"hanzi": "我是昨天来的。", "pinyin": "Wǒ shì zuótiān lái de.", "en": "I came yesterday."},
             {"hanzi": "他是坐地铁去的。", "pinyin": "Tā shì zuò dìtiě qù de.", "en": "He went by subway."},
         ]},
        {"pattern": "一……就……", "title": "As soon as",
         "body": "一 + event + 就 + result. The first action triggers the second immediately.",
         "examples": [
             {"hanzi": "我一回家就洗澡。", "pinyin": "Wǒ yì huíjiā jiù xǐzǎo.", "en": "As soon as I get home, I shower."},
             {"hanzi": "他一坐下就睡着了。", "pinyin": "Tā yí zuòxià jiù shuìzháo le.", "en": "As soon as he sat down, he fell asleep."},
         ]},
    ],
    4: [
        {"pattern": "不仅……而且……", "title": "Not only, but also",
         "body": "不仅 opens the first quality; 而且 adds a stronger one. 也 or 还 can replace 而且 in speech.",
         "examples": [
             {"hanzi": "他不仅聪明，而且很努力。", "pinyin": "Tā bùjǐn cōngming, érqiě hěn nǔlì.", "en": "He is not only clever but also hard-working."},
             {"hanzi": "这里不仅安静，也很方便。", "pinyin": "Zhèlǐ bùjǐn ānjìng, yě hěn fāngbiàn.", "en": "This place is not only quiet but also convenient."},
         ]},
        {"pattern": "无论……都……", "title": "No matter what",
         "body": "无论 introduces a free-choice condition; 都 closes the sentence. The question word inside stays put: 无论谁来.",
         "examples": [
             {"hanzi": "无论多忙，他每天都看书。", "pinyin": "Wúlùn duō máng, tā měitiān dōu kàn shū.", "en": "No matter how busy, he reads every day."},
             {"hanzi": "无论你去哪儿，我都支持你。", "pinyin": "Wúlùn nǐ qù nǎr, wǒ dōu zhīchí nǐ.", "en": "Wherever you go, I support you."},
         ]},
        {"pattern": "越……越……", "title": "The more, the more",
         "body": "Two 越 clauses move together. The first sets the change, the second the result.",
         "examples": [
             {"hanzi": "越学越有意思。", "pinyin": "Yuè xué yuè yǒu yìsi.", "en": "The more you learn, the more interesting it gets."},
             {"hanzi": "雨越下越大。", "pinyin": "Yǔ yuè xià yuè dà.", "en": "The rain got heavier and heavier."},
         ]},
        {"pattern": "对……感兴趣", "title": "Interested in",
         "body": "对 marks the object of interest. 感兴趣 is the whole predicate; do not leave out 感.",
         "examples": [
             {"hanzi": "我对中国文化很感兴趣。", "pinyin": "Wǒ duì Zhōngguó wénhuà hěn gǎn xìngqù.", "en": "I am very interested in Chinese culture."},
             {"hanzi": "他对历史不感兴趣。", "pinyin": "Tā duì lìshǐ bù gǎn xìngqù.", "en": "He is not interested in history."},
         ]},
        {"pattern": "差不多", "title": "Almost; about the same",
         "body": "差不多 can modify a quantity or stand alone as a predicate. It means closeness, not exactness.",
         "examples": [
             {"hanzi": "我们差不多到了。", "pinyin": "Wǒmen chàbuduō dào le.", "en": "We are almost there."},
             {"hanzi": "这两个差不多。", "pinyin": "Zhè liǎng ge chàbuduō.", "en": "These two are about the same."},
         ]},
        {"pattern": "只好", "title": "Have no choice but",
         "body": "只好 marks the only remaining option after other paths close. It is weaker and more resigned than 必须.",
         "examples": [
             {"hanzi": "下雨了，我们只好回家。", "pinyin": "Xiàyǔ le, wǒmen zhǐhǎo huíjiā.", "en": "It rained, so we had to go home."},
             {"hanzi": "没有车，只好走路。", "pinyin": "Méiyǒu chē, zhǐhǎo zǒulù.", "en": "There was no car, so we had to walk."},
         ]},
        {"pattern": "连……都/也……", "title": "Even",
         "body": "连 marks the extreme case; 都 or 也 closes it. The point is that if this case is true, all easier cases are too.",
         "examples": [
             {"hanzi": "他连饭都没吃。", "pinyin": "Tā lián fàn dōu méi chī.", "en": "He did not even eat."},
             {"hanzi": "这个字连老师也不认识。", "pinyin": "Zhège zì lián lǎoshī yě bú rènshi.", "en": "Even the teacher does not know this character."},
         ]},
    ],
    5: [
        {"pattern": "毕竟", "title": "After all",
         "body": "毕竟 introduces the fact that explains or excuses the situation. It usually stands before the subject or the predicate.",
         "examples": [
             {"hanzi": "他毕竟还年轻，需要时间。", "pinyin": "Tā bìjìng hái niánqīng, xūyào shíjiān.", "en": "After all, he is still young and needs time."},
             {"hanzi": "这毕竟是第一次，别太紧张。", "pinyin": "Zhè bìjìng shì dì yī cì, bié tài jǐnzhāng.", "en": "After all, this is the first time; do not be too nervous."},
         ]},
        {"pattern": "难免", "title": "Hard to avoid",
         "body": "难免 states that something undesirable is almost certain. It often precedes a verb or a short clause.",
         "examples": [
             {"hanzi": "刚开始难免会犯错。", "pinyin": "Gāng kāishǐ nánmiǎn huì fàncuò.", "en": "At the beginning, mistakes are hard to avoid."},
             {"hanzi": "人多的地方难免吵闹。", "pinyin": "Rén duō de dìfang nánmiǎn chǎonào.", "en": "Crowded places are inevitably noisy."},
         ]},
        {"pattern": "与其……不如……", "title": "Rather than",
         "body": "与其 names the rejected option; 不如 names the preferred one. Both halves must be comparable actions.",
         "examples": [
             {"hanzi": "与其抱怨，不如行动。", "pinyin": "Yǔqí bàoyuàn, bùrú xíngdòng.", "en": "Rather than complain, act."},
             {"hanzi": "与其等车，不如走路。", "pinyin": "Yǔqí děng chē, bùrú zǒulù.", "en": "Rather than wait for the bus, walk."},
         ]},
        {"pattern": "一旦……就……", "title": "Once",
         "body": "一旦 marks a condition that, once true, triggers the result at once. Stronger than 如果.",
         "examples": [
             {"hanzi": "一旦开始，就不要停。", "pinyin": "Yídàn kāishǐ, jiù búyào tíng.", "en": "Once you start, do not stop."},
             {"hanzi": "一旦失去，才知道珍惜。", "pinyin": "Yídàn shīqù, cái zhīdào zhēnxī.", "en": "Only once lost do you know how to value it."},
         ]},
        {"pattern": "为……而……", "title": "For the sake of",
         "body": "为 marks the purpose or beneficiary; 而 links it to the action. Written and formal in feel.",
         "examples": [
             {"hanzi": "他为梦想而努力。", "pinyin": "Tā wèi mèngxiǎng ér nǔlì.", "en": "He works hard for his dream."},
             {"hanzi": "我们为健康而运动。", "pinyin": "Wǒmen wèi jiànkāng ér yùndòng.", "en": "We exercise for health."},
         ]},
        {"pattern": "拿……来说", "title": "Take ... as an example",
         "body": "拿 introduces the example; 来说 closes the frame. The comment follows.",
         "examples": [
             {"hanzi": "拿北京来说，交通很方便。", "pinyin": "Ná Běijīng lái shuō, jiāotōng hěn fāngbiàn.", "en": "Take Beijing: transport is convenient."},
             {"hanzi": "拿学汉语来说，坚持最重要。", "pinyin": "Ná xué Hànyǔ lái shuō, jiānchí zuì zhòngyào.", "en": "Take learning Chinese: persistence matters most."},
         ]},
    ],
    6: [
        {"pattern": "鉴于", "title": "In view of",
         "body": "鉴于 opens a formal reason, usually a fact or situation. It belongs to written and official language.",
         "examples": [
             {"hanzi": "鉴于天气原因，活动取消了。", "pinyin": "Jiànyú tiānqì yuányīn, huódòng qǔxiāo le.", "en": "In view of the weather, the event was cancelled."},
             {"hanzi": "鉴于目前的困难，我们需要新方案。", "pinyin": "Jiànyú mùqián de kùnnan, wǒmen xūyào xīn fāng'àn.", "en": "Given the current difficulties, we need a new plan."},
         ]},
        {"pattern": "未免", "title": "A bit too; rather",
         "body": "未免 softens a criticism: the speaker finds something excessive or inappropriate. It often pairs with 太 or 过于.",
         "examples": [
             {"hanzi": "这个要求未免太高了。", "pinyin": "Zhège yāoqiú wèimiǎn tài gāo le.", "en": "This demand is a bit too high."},
             {"hanzi": "你未免太着急了。", "pinyin": "Nǐ wèimiǎn tài zháojí le.", "en": "You are rather too impatient."},
         ]},
        {"pattern": "何尝……", "title": "Have I not ...?",
         "body": "何尝 forms a rhetorical question that asserts the opposite. It often appears with 不是 or 不想.",
         "examples": [
             {"hanzi": "我何尝不想去呢？", "pinyin": "Wǒ hécháng bù xiǎng qù ne?", "en": "How could I not want to go?"},
             {"hanzi": "他何尝不知道这件事？", "pinyin": "Tā hécháng bù zhīdào zhè jiàn shì?", "en": "How could he not know about this?"},
         ]},
        {"pattern": "以免", "title": "So as to avoid",
         "body": "以免 introduces a negative purpose. The clause after it names what must not happen.",
         "examples": [
             {"hanzi": "请提前出发，以免迟到。", "pinyin": "Qǐng tíqián chūfā, yǐmiǎn chídào.", "en": "Please leave early so as not to be late."},
             {"hanzi": "请保存文件，以免丢失。", "pinyin": "Qǐng bǎocún wénjiàn, yǐmiǎn diūshī.", "en": "Please save the file so it is not lost."},
         ]},
        {"pattern": "并非……而是……", "title": "Not ... but rather ...",
         "body": "并非 denies the first description; 而是 supplies the true one. Firmer and more written than 不是……而是…….",
         "examples": [
             {"hanzi": "他并非反对，而是在思考。", "pinyin": "Tā bìngfēi fǎnduì, ér shì zài sīkǎo.", "en": "He is not opposing; he is thinking."},
             {"hanzi": "这并非偶然，而是必然。", "pinyin": "Zhè bìngfēi ǒurán, ér shì bìrán.", "en": "This is not accidental but inevitable."},
         ]},
        {"pattern": "之所以……是因为……", "title": "The reason why",
         "body": "之所以 opens the explained fact; 是因为 gives the cause. The order is result first, reason second.",
         "examples": [
             {"hanzi": "他之所以成功，是因为坚持。", "pinyin": "Tā zhīsuǒyǐ chénggōng, shì yīnwèi jiānchí.", "en": "The reason he succeeded is persistence."},
             {"hanzi": "之所以选择这里，是因为安静。", "pinyin": "Zhīsuǒyǐ xuǎnzé zhèlǐ, shì yīnwèi ānjìng.", "en": "The reason for choosing this place is that it is quiet."},
         ]},
    ],
}
