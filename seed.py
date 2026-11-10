# -*- coding: utf-8 -*-
"""Seed content for Lowkey Mandarin.

Most relations are hand-written or derived from real character composition.
Links imported with the HSK 1-5 list state the shared character in their note,
so the graph stays factual even where the connection is only orthographic.
"""
from __future__ import annotations

import json

try:
    from extra_words import WORDS as _EXTRA_WORDS
    from extra_words_advanced import WORDS as _EXTRA_ADVANCED
    from extra_words_hsk import WORDS as _HSK_WORDS
    from extra_relations import RELATIONS as _EXTRA_RELATIONS
    from extra_relations_hsk import RELATIONS as _HSK_RELATIONS
except ImportError:  # pragma: no cover - package import
    from .extra_words import WORDS as _EXTRA_WORDS
    from .extra_words_advanced import WORDS as _EXTRA_ADVANCED
    from .extra_words_hsk import WORDS as _HSK_WORDS
    from .extra_relations import RELATIONS as _EXTRA_RELATIONS
    from .extra_relations_hsk import RELATIONS as _HSK_RELATIONS

# hanzi, pinyin, meaning, category, hsk, radical, strokes, components,
# example, example_pinyin, example_en, note
WORDS = [
    # ---------------- TIME ----------------
    ("今天", "jīntiān", "today", "time", 1, "日", 8, "日 天",
     "今天天气很好。", "Jīntiān tiānqì hěn hǎo.", "The weather is good today.",
     "今天 = this + day; the 天 inside it is the same 天 as 'sky'."),
    ("昨天", "zuótiān", "yesterday", "time", 1, "日", 9, "日 天",
     "昨天我很忙。", "Zuótiān wǒ hěn máng.", "I was busy yesterday.",
     "昨天 uses 昨, a character that only lives in time words."),
    ("明天", "míngtiān", "tomorrow", "time", 1, "日", 8, "日 月 天",
     "明天见。", "Míngtiān jiàn.", "See you tomorrow.",
     "明 is 日 + 月: sun and moon, the two lights that mark a new day."),
    ("前天", "qiántiān", "the day before yesterday", "time", 2, "日", 9, "日 天",
     "前天他来了。", "Qiántiān tā lái le.", "He came the day before yesterday.",
     "前 (front/before) + 天 (day)."),
    ("后天", "hòutiān", "the day after tomorrow", "time", 2, "日", 6, "日 天",
     "后天我们出发。", "Hòutiān wǒmen chūfā.", "We leave the day after tomorrow.",
     "后 (behind/after) + 天 (day)."),
    ("每天", "měitiān", "every day", "time", 1, "日", 7, "日 天",
     "我每天学汉语。", "Wǒ měitiān xué Hànyǔ.", "I study Chinese every day.",
     "每 (each) + 天 (day); the daily rhythm word."),
    ("时间", "shíjiān", "time", "time", 2, "日", 12, "日",
     "你有时间吗？", "Nǐ yǒu shíjiān ma?", "Do you have time?",
     "时间 is time as a resource; 时候 is time as a moment."),
    ("现在", "xiànzài", "now", "time", 1, "土", 12, "",
     "现在是三点。", "Xiànzài shì sān diǎn.", "It is three o'clock now.",
     "现 (present) + 在 (at)."),
    ("早上", "zǎoshang", "morning", "time", 1, "日", 10, "日",
     "早上好。", "Zǎoshang hǎo.", "Good morning.",
     "早 (early) + 上 (above/on); the early part of the day."),
    ("晚上", "wǎnshang", "evening", "time", 1, "日", 15, "日",
     "晚上我们一起吃饭。", "Wǎnshang wǒmen yìqǐ chīfàn.", "We eat together in the evening.",
     "晚 (late) + 上; the late part of the day."),
    ("未来", "wèilái", "future", "time", 3, "木", 12, "",
     "未来会发生什么？", "Wèilái huì fāshēng shénme?", "What will happen in the future?",
     "未 (not yet) + 来 (come): what has not come yet."),
    ("过去", "guòqù", "past", "time", 3, "辶", 11, "",
     "过去的事情就过去了。", "Guòqù de shìqing jiù guòqù le.", "What is past is past.",
     "过 (pass) + 去 (go): what has gone by."),
    ("年", "nián", "year", "time", 1, "干", 6, "",
     "一年有十二个月。", "Yì nián yǒu shí'èr ge yuè.", "A year has twelve months.",
     "年 began as a picture of a grain harvest cycle."),
    ("月", "yuè", "moon; month", "time", 1, "月", 4, "",
     "月亮出来了。", "Yuèliang chūlái le.", "The moon has come out.",
     "One character holds both 'moon' and 'month' because lunar cycles measured months."),
    ("日", "rì", "sun; day", "time", 2, "日", 4, "",
     "日复一日。", "Rì fù yí rì.", "Day after day.",
     "日 is the sun pictograph, and the radical inside most time words."),
    ("时候", "shíhou", "moment; time when", "time", 2, "日", 14, "日",
     "你什么时候来？", "Nǐ shénme shíhou lái?", "When are you coming?",
     "时候 is a moment in a sequence; 时间 is duration."),

    # ---------------- PEOPLE ----------------
    ("家", "jiā", "home; family", "people", 1, "宀", 10, "",
     "我回家了。", "Wǒ huí jiā le.", "I went home.",
     "宀 (roof) over 豕 (pig): shelter and livestock, an ancient household."),
    ("家人", "jiārén", "family members", "people", 2, "宀", 12, "人",
     "家人很重要。", "Jiārén hěn zhòngyào.", "Family is important.",
     "家 (home) + 人 (person)."),
    ("爸爸", "bàba", "dad", "people", 1, "父", 12, "",
     "我爸爸是老师。", "Wǒ bàba shì lǎoshī.", "My dad is a teacher.",
     "Reduplicated kinship term, like 妈妈."),
    ("妈妈", "māma", "mom", "people", 1, "女", 12, "女",
     "妈妈在家。", "Māma zài jiā.", "Mom is at home.",
     "女 (woman) radical on both characters."),
    ("哥哥", "gēge", "older brother", "people", 1, "口", 20, "口",
     "哥哥比我大三岁。", "Gēge bǐ wǒ dà sān suì.", "My older brother is three years older than me.",
     "口 radical; reduplication marks the elder sibling."),
    ("姐姐", "jiějie", "older sister", "people", 1, "女", 16, "女",
     "姐姐喜欢喝茶。", "Jiějie xǐhuan hē chá.", "My older sister likes tea.",
     "女 radical; parallel to 哥哥."),
    ("孩子", "háizi", "child", "people", 1, "子", 13, "子",
     "孩子在玩。", "Háizi zài wán.", "The child is playing.",
     "子 (child) anchors the word; also a common noun suffix."),
    ("朋友", "péngyou", "friend", "people", 1, "月", 12, "月",
     "他是我朋友。", "Tā shì wǒ péngyou.", "He is my friend.",
     "月 is the shared radical in 朋 and 友's older forms; friendship as companionship."),
    ("人", "rén", "person", "people", 1, "人", 2, "",
     "这里有很多人。", "Zhèlǐ yǒu hěn duō rén.", "There are many people here.",
     "A walking figure in profile: the ancestor of the 人 radical."),
    ("女", "nǚ", "woman", "people", 2, "女", 3, "",
     "那位女老师很友好。", "Nà wèi nǚ lǎoshī hěn yǒuhǎo.", "That female teacher is friendly.",
     "A seated figure; a high-frequency radical on the left of characters."),
    ("子", "zǐ", "child; suffix", "people", 2, "子", 3, "",
     "孩子笑了。", "Háizi xiào le.", "The child laughed.",
     "A swaddled infant; also the noun suffix in 桌子, 孩子."),
    ("心", "xīn", "heart; mind", "people", 2, "心", 4, "",
     "用心学。", "Yòngxīn xué.", "Study with heart.",
     "A picture of the heart; the source of both feeling and thought in Chinese."),
    ("口", "kǒu", "mouth; opening", "people", 2, "口", 3, "",
     "门口有人。", "Ménkǒu yǒu rén.", "There is someone at the door.",
     "An open mouth; the radical of eating, drinking, speaking."),
    ("手", "shǒu", "hand", "people", 2, "手", 4, "",
     "请举手。", "Qǐng jǔ shǒu.", "Please raise your hand.",
     "Five fingers, simplified to four strokes."),
    ("目", "mù", "eye", "people", 3, "目", 5, "",
     "目光相遇。", "Mùguāng xiāngyù.", "Their eyes met.",
     "An eye turned sideways; the radical of seeing."),

    # ---------------- FOOD ----------------
    ("吃", "chī", "to eat", "food", 1, "口", 6, "口",
     "你吃了吗？", "Nǐ chī le ma?", "Have you eaten?",
     "口 (mouth) radical. 你吃了吗 is a greeting, not a real question."),
    ("喝", "hē", "to drink", "food", 1, "口", 12, "口",
     "我想喝水。", "Wǒ xiǎng hē shuǐ.", "I want to drink water.",
     "口 (mouth) + 曷, a sound component."),
    ("咖啡", "kāfēi", "coffee", "food", 2, "口", 19, "口",
     "一杯咖啡，谢谢。", "Yì bēi kāfēi, xièxie.", "One coffee, please.",
     "A loanword written with mouth radicals because it is a sound, not a meaning."),
    ("茶", "chá", "tea", "food", 2, "艹", 9, "",
     "请喝茶。", "Qǐng hē chá.", "Please have some tea.",
     "艹 (plant) over 人 and 木: leaves picked from a tree by people."),
    ("米饭", "mǐfàn", "cooked rice", "food", 2, "米", 13, "",
     "我想吃米饭。", "Wǒ xiǎng chī mǐfàn.", "I want to eat rice.",
     "米 (raw rice) + 饭 (meal); a staple, not a dessert."),
    ("菜", "cài", "dish; vegetable", "food", 2, "艹", 11, "",
     "这个菜很好吃。", "Zhège cài hěn hǎochī.", "This dish is delicious.",
     "艹 (plant) + 采 (pick): something harvested, then cooked."),
    ("好吃", "hǎochī", "delicious", "food", 1, "女", 9, "女 子 口",
     "这个菜很好吃。", "Zhège cài hěn hǎochī.", "This dish is delicious.",
     "Literally 'good to eat'; 好 modifies the verb 吃."),
    ("饭馆", "fànguǎn", "restaurant", "food", 2, "食", 14, "",
     "我们去饭馆吃饭。", "Wǒmen qù fànguǎn chīfàn.", "We are going to a restaurant to eat.",
     "饭 (meal) + 馆 (establishment)."),
    ("饿", "è", "hungry", "food", 2, "食", 10, "",
     "我饿了。", "Wǒ è le.", "I'm hungry.",
     "食 (food) radical + 我 (I): food and self."),
    ("水", "shuǐ", "water", "nature", 1, "水", 4, "",
     "请给我水。", "Qǐng gěi wǒ shuǐ.", "Please give me water.",
     "A flowing stream; the radical 氵 is its compressed form."),

    # ---------------- TRAVEL ----------------
    ("去", "qù", "to go", "travel", 1, "厶", 5, "",
     "我去学校。", "Wǒ qù xuéxiào.", "I am going to school.",
     "去 points away from the speaker; 来 points toward."),
    ("来", "lái", "to come", "travel", 1, "木", 7, "木",
     "请来这里。", "Qǐng lái zhèlǐ.", "Please come here.",
     "来 originally pictured a wheat plant; the meaning shifted to 'come'."),
    ("走", "zǒu", "to walk; to leave", "travel", 1, "走", 7, "",
     "我们走吧。", "Wǒmen zǒu ba.", "Let's go.",
     "A person moving on foot; also 'to leave' in spoken Chinese."),
    ("坐", "zuò", "to sit; to take (transport)", "travel", 1, "土", 7, "",
     "坐地铁很方便。", "Zuò dìtiě hěn fāngbiàn.", "Taking the subway is convenient.",
     "Two people on the ground: the basis of 'sit' and 'take a vehicle'."),
    ("地铁", "dìtiě", "subway", "travel", 2, "土", 16, "",
     "我每天坐地铁。", "Wǒ měitiān zuò dìtiě.", "I take the subway every day.",
     "地 (ground) + 铁 (iron): iron under the ground."),
    ("火车", "huǒchē", "train", "travel", 2, "火", 8, "火",
     "火车快到了。", "Huǒchē kuài dào le.", "The train is arriving soon.",
     "火 (fire) + 车 (vehicle): the steam train."),
    ("飞机", "fēijī", "airplane", "travel", 2, "飞", 9, "",
     "飞机起飞了。", "Fēijī qǐfēi le.", "The plane took off.",
     "飞 (fly) + 机 (machine)."),
    ("机场", "jīchǎng", "airport", "travel", 2, "木", 12, "",
     "去机场怎么走？", "Qù jīchǎng zěnme zǒu?", "How do I get to the airport?",
     "机 (aircraft) + 场 (field): the field for planes."),
    ("学校", "xuéxiào", "school", "travel", 1, "子", 16, "学",
     "学校在那边。", "Xuéxiào zài nàbiān.", "The school is over there.",
     "学 (learn) + 校 (school building)."),
    ("北京", "Běijīng", "Beijing", "travel", 2, "匕", 13, "",
     "我要去北京。", "Wǒ yào qù Běijīng.", "I want to go to Beijing.",
     "北 (north) + 京 (capital): the northern capital."),
    ("中国", "Zhōngguó", "China", "travel", 1, "丨", 12, "",
     "中国很大。", "Zhōngguó hěn dà.", "China is large.",
     "中 (middle) + 国 (country): the middle kingdom."),
    ("路", "lù", "road; route", "travel", 1, "足", 13, "",
     "这条路很远。", "Zhè tiáo lù hěn yuǎn.", "This road is far.",
     "足 (foot) radical: a path is walked."),
    ("远", "yuǎn", "far", "travel", 2, "辶", 7, "",
     "学校远不远？", "Xuéxiào yuǎn bu yuǎn?", "Is the school far?",
     "辶 (movement) + 元 (sound)."),
    ("近", "jìn", "near", "travel", 2, "辶", 7, "",
     "我家很近。", "Wǒ jiā hěn jìn.", "My home is near.",
     "辶 (movement) + 斤 (sound); the opposite of 远."),
    ("门", "mén", "door; gate", "travel", 2, "门", 3, "",
     "请关门。", "Qǐng guān mén.", "Please close the door.",
     "A pair of swinging gate leaves."),

    # ---------------- STUDY ----------------
    ("学", "xué", "to learn; to study", "study", 1, "子", 8, "子",
     "我学汉语。", "Wǒ xué Hànyǔ.", "I study Chinese.",
     "子 (child) under a roof: learning under a roof, at home or school."),
    ("学生", "xuésheng", "student", "study", 1, "子", 13, "学 子",
     "他是学生。", "Tā shì xuésheng.", "He is a student.",
     "学 (learn) + 生 (person): one who learns."),
    ("老师", "lǎoshī", "teacher", "study", 1, "老", 12, "",
     "老师来了。", "Lǎoshī lái le.", "The teacher is here.",
     "老 (old/senior) + 师 (master): a respectful title, not a comment on age."),
    ("书", "shū", "book", "study", 1, "乙", 4, "",
     "我在看书。", "Wǒ zài kàn shū.", "I am reading a book.",
     "Originally a hand holding a brush, later reduced to four strokes."),
    ("字", "zì", "written character", "study", 1, "子", 6, "子",
     "这个字怎么读？", "Zhège zì zěnme dú?", "How do you read this character?",
     "宀 (roof) + 子 (child): a character raised under a roof, taught at home."),
    ("汉语", "Hànyǔ", "the Chinese language", "study", 1, "氵", 14, "",
     "我在学汉语。", "Wǒ zài xué Hànyǔ.", "I am learning Chinese.",
     "汉 (Han people) + 语 (language)."),
    ("说话", "shuōhuà", "to speak; to talk", "study", 1, "讠", 14, "",
     "请慢慢说话。", "Qǐng mànman shuōhuà.", "Please speak slowly.",
     "说 (speak) + 话 (words): the act of talking."),
    ("知道", "zhīdào", "to know (a fact)", "study", 1, "矢", 14, "",
     "我知道。", "Wǒ zhīdào.", "I know.",
     "知道 is knowing a fact; 认识 is knowing a person or place."),
    ("认识", "rènshi", "to know; to recognize", "study", 1, "讠", 11, "",
     "认识你很高兴。", "Rènshi nǐ hěn gāoxìng.", "Nice to meet you.",
     "认 (recognize) + 识 (know); used for people, places, characters."),
    ("问", "wèn", "to ask", "study", 1, "门", 6, "门 口",
     "我问老师。", "Wǒ wèn lǎoshī.", "I ask the teacher.",
     "门 (door) + 口 (mouth): a mouth at the door, asking."),
    ("回答", "huídá", "to answer", "study", 2, "口", 13, "口",
     "请回答问题。", "Qǐng huídá wèntí.", "Please answer the question.",
     "回 (return) + 答 (reply)."),
    ("写", "xiě", "to write", "study", 1, "冖", 5, "",
     "请写你的名字。", "Qǐng xiě nǐ de míngzi.", "Please write your name.",
     "A hand moving a brush under a cover, simplified to five strokes."),
    ("说", "shuō", "to say; to speak", "study", 1, "讠", 9, "",
     "你说什么？", "Nǐ shuō shénme?", "What did you say?",
     "讠 (speech) radical + 兑 (sound)."),

    # ---------------- NATURE ----------------
    ("山", "shān", "mountain", "nature", 1, "山", 3, "",
     "山很高。", "Shān hěn gāo.", "The mountain is high.",
     "Three peaks rising from the ground."),
    ("木", "mù", "tree; wood", "nature", 1, "木", 4, "",
     "木头很重。", "Mùtou hěn zhòng.", "Wood is heavy.",
     "A trunk with roots and branches."),
    ("林", "lín", "forest", "nature", 2, "木", 8, "木",
     "前面有一片林。", "Qiánmiàn yǒu yí piàn lín.", "There is a forest ahead.",
     "Two trees side by side: 木 + 木."),
    ("火", "huǒ", "fire", "nature", 1, "火", 4, "",
     "火很亮。", "Huǒ hěn liàng.", "The fire is bright.",
     "A flame with two sparks."),
    ("雨", "yǔ", "rain", "nature", 1, "雨", 8, "",
     "外面在下雨。", "Wàimiàn zài xià yǔ.", "It is raining outside.",
     "A cloud with drops falling from it."),
    ("天", "tiān", "sky; day", "nature", 1, "大", 4, "",
     "天蓝了。", "Tiān lán le.", "The sky turned blue.",
     "A person with a line above: what is above the human."),
    ("太阳", "tàiyáng", "sun", "nature", 2, "大", 10, "日",
     "太阳出来了。", "Tàiyáng chūlái le.", "The sun came out.",
     "太 (great) + 阳 (yang, sun side)."),
    ("月亮", "yuèliang", "moon", "nature", 2, "月", 14, "月",
     "月亮很圆。", "Yuèliang hěn yuán.", "The moon is full.",
     "月 (moon) + 亮 (bright); the everyday word for the moon."),
    ("休", "xiū", "to rest", "nature", 3, "亻", 6, "人 木",
     "休息一下吧。", "Xiūxi yíxià ba.", "Take a break.",
     "A person (人) leaning against a tree (木)."),

    # ---------------- FEELING ----------------
    ("好", "hǎo", "good; well", "feeling", 1, "女", 6, "女 子",
     "今天很好。", "Jīntiān hěn hǎo.", "Today is good.",
     "女 (woman) + 子 (child): an ancient image of a good household."),
    ("高兴", "gāoxìng", "happy; glad", "feeling", 1, "高", 16, "",
     "我很高兴。", "Wǒ hěn gāoxìng.", "I am very happy.",
     "高 (high) + 兴 (rise): spirits lifted."),
    ("喜欢", "xǐhuan", "to like", "feeling", 1, "口", 18, "口",
     "我喜欢喝茶。", "Wǒ xǐhuan hē chá.", "I like drinking tea.",
     "喜 (joy) + 欢 (delight); a softer like than 爱."),
    ("爱", "ài", "to love", "feeling", 1, "爫", 10, "",
     "我爱我的家人。", "Wǒ ài wǒ de jiārén.", "I love my family.",
     "Simplified from 愛, which carried 心 (heart) at its centre."),
    ("想", "xiǎng", "to want; to think", "feeling", 1, "心", 13, "心",
     "我想去中国。", "Wǒ xiǎng qù Zhōngguó.", "I want to go to China.",
     "相 (sound) over 心 (heart): thought and desire share one character."),
    ("累", "lèi", "tired", "feeling", 2, "糸", 11, "",
     "我累了。", "Wǒ lèi le.", "I'm tired.",
     "糸 (silk thread) + 田 (field): work that unravels you."),
    ("忙", "máng", "busy", "feeling", 2, "忄", 6, "心",
     "你今天忙吗？", "Nǐ jīntiān máng ma?", "Are you busy today?",
     "忄 (heart) + 亡 (lose): busyness as losing one's heart."),

    # ---------------- ACTION ----------------
    ("做", "zuò", "to do; to make", "action", 1, "亻", 11, "人 口",
     "你在做什么？", "Nǐ zài zuò shénme?", "What are you doing?",
     "亻 (person) + 故 (sound): a person acting on something."),
    ("看", "kàn", "to look; to read", "action", 1, "目", 9, "目 手",
     "你看这个字。", "Nǐ kàn zhège zì.", "Look at this character.",
     "手 (hand) over 目 (eye): shading the eyes to see far."),
    ("听", "tīng", "to listen", "action", 1, "口", 7, "口",
     "请听我说。", "Qǐng tīng wǒ shuō.", "Please listen to me.",
     "口 (mouth) + 斤 (sound); listening as a social act."),
    ("买", "mǎi", "to buy", "action", 1, "乙", 6, "",
     "我买咖啡。", "Wǒ mǎi kāfēi.", "I am buying coffee.",
     "Simplified from 買, which shows a net over a shell (money)."),
    ("开", "kāi", "to open; to drive", "action", 1, "廾", 4, "",
     "请开门。", "Qǐng kāi mén.", "Please open the door.",
     "Two hands lifting a bar: to open."),
    ("关", "guān", "to close", "action", 1, "八", 6, "",
     "请关门。", "Qǐng guān mén.", "Please close the door.",
     "Originally a door bolt; the opposite of 开."),
]

# Extended HSK 1-6 material. Kept in separate modules so the base seed stays
# readable and the graph keeps growing without one enormous list.
WORDS = WORDS + list(_EXTRA_WORDS) + list(_EXTRA_ADVANCED) + list(_HSK_WORDS)

# (a, b, type, note, strength)  type: synonym | antonym | time | semantic |
# collocation | sentence | component
RELATIONS = [
    # TIME
    ("今天", "昨天", "time", "One day back.", 5),
    ("今天", "明天", "time", "One day forward.", 5),
    ("昨天", "前天", "time", "One more day back.", 5),
    ("明天", "后天", "time", "One more day forward.", 5),
    ("今天", "每天", "semantic", "A single day vs. the repeating day.", 4),
    ("今天", "现在", "semantic", "Today contains this moment.", 4),
    ("昨天", "过去", "semantic", "Yesterday belongs to the past.", 4),
    ("明天", "未来", "semantic", "Tomorrow belongs to the future.", 4),
    ("未来", "过去", "antonym", "Future and past face opposite directions.", 5),
    ("时间", "时候", "synonym", "Both are 'time'; 时间 is duration, 时候 is a moment.", 5),
    ("时间", "每天", "semantic", "Daily rhythm is how time is felt.", 3),
    ("时间", "年", "semantic", "Years measure time.", 3),
    ("年", "月", "semantic", "Months divide a year.", 4),
    ("月", "日", "semantic", "Days divide a month.", 4),
    ("日", "天", "synonym", "日 is the written day; 天 is the spoken day.", 5),
    ("日", "太阳", "synonym", "日 depicts the sun.", 4),
    ("早上", "晚上", "antonym", "Morning and evening bracket the day.", 5),
    ("早上", "现在", "semantic", "Morning is a position in the day.", 2),
    ("晚上", "月", "semantic", "The moon marks the evening.", 3),
    ("月亮", "月", "synonym", "月 is the character; 月亮 the everyday word.", 5),
    ("每天", "早上", "collocation", "每天早上 — every morning.", 4),
    ("今天", "雨", "sentence", "今天下雨。 — It is raining today.", 3),
    ("明天", "去", "sentence", "明天去学校。 — Go to school tomorrow.", 3),
    ("每天", "咖啡", "sentence", "我每天早上喝咖啡。 — I drink coffee every morning.", 3),
    ("忙", "时间", "collocation", "没时间 — to have no time.", 3),
    ("天", "雨", "collocation", "下雨天 — a rainy day.", 4),
    ("天", "太阳", "sentence", "今天太阳很好。 — The sun is nice today.", 2),

    # PEOPLE
    ("爸爸", "妈妈", "semantic", "The two parent words.", 5),
    ("爸爸", "家人", "semantic", "Father is family.", 4),
    ("妈妈", "家人", "semantic", "Mother is family.", 4),
    ("哥哥", "姐姐", "semantic", "The two elder-sibling words.", 5),
    ("家人", "家", "semantic", "家 is the home; 家人 are its people.", 5),
    ("孩子", "家人", "semantic", "A child is part of the family.", 4),
    ("孩子", "子", "semantic", "子 is the character for child.", 5),
    ("朋友", "家人", "semantic", "Friends can be chosen family.", 3),
    ("朋友", "高兴", "sentence", "见到朋友很高兴。 — I'm happy to see my friend.", 3),
    ("女", "妈妈", "semantic", "妈妈 carries the 女 radical twice.", 4),
    ("女", "姐姐", "semantic", "姐姐 carries the 女 radical twice.", 4),
    ("子", "孩子", "semantic", "孩子 ends in 子.", 4),
    ("心", "想", "semantic", "Thinking lives in the heart in Chinese.", 5),
    ("心", "高兴", "semantic", "Happiness is a state of heart.", 3),
    ("心", "爱", "semantic", "Traditional 愛 contains 心.", 4),
    ("口", "吃", "semantic", "Eating is done with the mouth.", 5),
    ("口", "喝", "semantic", "Drinking is done with the mouth.", 5),
    ("口", "说", "semantic", "Speech leaves through the mouth.", 5),
    ("目", "看", "semantic", "Seeing is done with the eyes.", 5),
    ("手", "做", "collocation", "动手做 — to put hands to work.", 4),
    ("休", "累", "sentence", "累了就休息。 — Rest when tired.", 4),

    # FOOD
    ("吃", "喝", "semantic", "The two consumption verbs.", 5),
    ("吃", "米饭", "collocation", "吃饭 — to eat a meal.", 5),
    ("吃", "菜", "collocation", "吃菜 — to eat dishes.", 4),
    ("吃", "好吃", "semantic", "好吃 is literally 'good to eat'.", 5),
    ("吃", "饿", "semantic", "Hunger calls for eating.", 4),
    ("吃", "饭馆", "sentence", "我们去饭馆吃饭。 — Let's eat at a restaurant.", 3),
    ("喝", "水", "collocation", "喝水 — to drink water.", 5),
    ("喝", "茶", "collocation", "喝茶 — to drink tea.", 4),
    ("喝", "咖啡", "collocation", "喝咖啡 — to drink coffee.", 4),
    ("咖啡", "茶", "semantic", "Two caffeine drinks, two cultures.", 4),
    ("茶", "中国", "semantic", "Tea culture began in China.", 4),
    ("咖啡", "早上", "sentence", "早上喝咖啡。 — Drink coffee in the morning.", 3),
    ("米饭", "菜", "collocation", "饭菜 — rice and dishes, a meal.", 5),
    ("好吃", "饭馆", "sentence", "这家饭馆很好吃。 — This restaurant is good.", 3),
    ("饿", "米饭", "sentence", "我饿了，想吃米饭。 — I'm hungry, I want rice.", 3),
    ("水", "火", "antonym", "Water extinguishes fire.", 4),
    ("饿", "吃", "semantic", "饿 is the state before 吃.", 5),
    ("喜欢", "茶", "sentence", "我喜欢喝茶。 — I like drinking tea.", 3),

    # TRAVEL
    ("去", "来", "antonym", "去 moves away; 来 moves toward the speaker.", 5),
    ("去", "走", "semantic", "Both describe leaving a place.", 3),
    ("坐", "地铁", "collocation", "坐地铁 — to take the subway.", 5),
    ("坐", "火车", "collocation", "坐火车 — to take a train.", 4),
    ("坐", "飞机", "collocation", "坐飞机 — to take a plane.", 4),
    ("地铁", "火车", "semantic", "Both are rail transit.", 4),
    ("火车", "飞机", "semantic", "Two long-distance options.", 4),
    ("飞机", "机场", "collocation", "机场 is where 飞机 departs.", 5),
    ("去", "中国", "collocation", "去中国 — to go to China.", 4),
    ("去", "学校", "collocation", "去学校 — to go to school.", 4),
    ("路", "远", "collocation", "路很远 — the road is long.", 4),
    ("路", "近", "collocation", "路很近 — the road is short.", 4),
    ("远", "近", "antonym", "Far and near.", 5),
    ("走", "路", "collocation", "走路 — to walk.", 5),
    ("开", "门", "collocation", "开门 — to open the door.", 5),
    ("关", "门", "collocation", "关门 — to close the door.", 5),
    ("开", "关", "antonym", "Open and close.", 5),
    ("北京", "中国", "semantic", "Beijing is the capital of China.", 4),
    ("北京", "地铁", "semantic", "Beijing has a vast subway network.", 3),
    ("地铁", "路", "semantic", "A subway is a route below the road.", 3),
    ("去", "机场", "sentence", "去机场怎么走？ — How do I get to the airport?", 3),
    ("学校", "近", "sentence", "学校很近。 — The school is near.", 3),
    ("家", "门", "collocation", "家门 — the family door.", 3),
    ("休", "木", "semantic", "A person rests against a tree.", 4),

    # STUDY
    ("学", "学生", "semantic", "学生 is 'one who learns'.", 5),
    ("学", "学校", "semantic", "学校 is where learning happens.", 5),
    ("学", "汉语", "collocation", "学汉语 — to study Chinese.", 5),
    ("老师", "学生", "semantic", "The classroom pair.", 5),
    ("书", "字", "semantic", "Books are made of characters.", 4),
    ("字", "写", "collocation", "写字 — to write characters.", 5),
    ("汉语", "中国", "semantic", "Chinese is the language of China.", 5),
    ("汉语", "说话", "semantic", "Speaking is how the language is used.", 4),
    ("说话", "说", "synonym", "说话 is the act; 说 is the verb.", 5),
    ("知道", "认识", "synonym", "Both mean 'know'; 知道 a fact, 认识 a person.", 5),
    ("问", "回答", "antonym", "Ask and answer.", 5),
    ("问", "老师", "collocation", "问老师 — to ask the teacher.", 4),
    ("回答", "老师", "collocation", "回答老师 — to answer the teacher.", 3),
    ("书", "看", "collocation", "看书 — to read a book.", 5),
    ("看", "目", "semantic", "看 sits on the eye radical 目.", 4),
    ("听", "说", "semantic", "Listening and speaking form a pair.", 4),
    ("听", "老师", "sentence", "听老师说。 — Listen to the teacher.", 3),
    ("想", "做", "collocation", "想做 — to want to do.", 4),
    ("说", "口", "semantic", "Speech leaves through the mouth.", 4),
    ("认识", "朋友", "sentence", "认识你很高兴。 — Nice to meet you.", 3),
    ("学", "累", "sentence", "学习很累。 — Studying is tiring.", 2),

    # NATURE
    ("山", "水", "collocation", "山水 — landscape, mountains and water.", 5),
    ("山", "木", "semantic", "Mountains carry trees.", 4),
    ("木", "林", "semantic", "林 is two 木: a forest is many trees.", 5),
    ("雨", "水", "semantic", "Rain is water falling.", 5),
    ("太阳", "月亮", "antonym", "Sun and moon, day and night.", 5),
    ("太阳", "日", "synonym", "日 depicts the sun.", 5),
    ("火", "山", "collocation", "火山 — volcano.", 4),
    ("水", "雨", "semantic", "Rain and water share the water radical.", 4),
    ("林", "山", "sentence", "山上有树林。 — There are woods on the mountain.", 3),
    ("天", "月亮", "sentence", "天上的月亮。 — The moon in the sky.", 2),

    # FEELING
    ("好", "高兴", "semantic", "Both describe a positive state.", 4),
    ("高兴", "喜欢", "semantic", "Gladness and liking.", 3),
    ("喜欢", "爱", "synonym", "喜欢 is 'like'; 爱 is 'love', stronger.", 5),
    ("想", "喜欢", "semantic", "Desire and preference.", 3),
    ("累", "忙", "semantic", "Two ways of being depleted.", 3),
    ("累", "休", "sentence", "累了就休息。 — Rest when tired.", 4),
    ("好", "好吃", "semantic", "好吃 is 'good to eat'.", 4),
    ("高兴", "朋友", "sentence", "见到朋友很高兴。 — Happy to see a friend.", 3),
    ("忙", "时间", "sentence", "我忙得没有时间。 — I'm too busy to have time.", 3),

    # ACTION
    ("做", "写", "semantic", "Both are productive actions.", 3),
    ("看", "听", "semantic", "The two receptive senses.", 4),
    ("说", "听", "semantic", "Speaking and listening.", 4),
    ("买", "咖啡", "sentence", "我买了一杯咖啡。 — I bought a coffee.", 4),
    ("买", "菜", "collocation", "买菜 — to buy groceries.", 4),
    ("做", "菜", "collocation", "做菜 — to cook.", 4),
    ("做", "家", "semantic", "家 is what 做 holds together.", 2),
    ("看", "书", "collocation", "看书 — to read.", 5),
    ("想", "家", "sentence", "我想家了。 — I miss home.", 3),
]

RELATIONS = RELATIONS + list(_EXTRA_RELATIONS) + list(_HSK_RELATIONS)

# Scene scripts. dialogue: [{who, hanzi, pinyin, en, cue}]
# choices: [{after, prompt, options:[{hanzi,pinyin,en,correct,reply,cue}]}]
SCENARIOS = [
    {
        "slug": "cafe",
        "title": "The Quiet Café",
        "hanzi": "在咖啡馆",
        "setting": "A narrow café off a Beijing hutong, 8:40 in the morning.",
        "description": "Order a coffee, answer the barista, and find a seat by the window.",
        "level": 1,
        "accent": "vermilion",
        "dialogue": [
            {"who": "Barista", "hanzi": "早上好！你想喝什么？", "pinyin": "Zǎoshang hǎo! Nǐ xiǎng hē shénme?", "en": "Good morning! What would you like to drink?", "cue": "zǎoshang"},
            {"who": "You", "hanzi": "我想要一杯咖啡。", "pinyin": "Wǒ xiǎng yào yì bēi kāfēi.", "en": "I'd like a coffee.", "cue": "kāfēi"},
            {"who": "Barista", "hanzi": "大杯还是小杯？", "pinyin": "Dà bēi háishi xiǎo bēi?", "en": "Large or small?", "cue": ""},
            {"who": "You", "hanzi": "小杯，谢谢。多少钱？", "pinyin": "Xiǎo bēi, xièxie. Duōshao qián?", "en": "Small, thanks. How much?", "cue": ""},
            {"who": "Barista", "hanzi": "十八块。这里有水，请自己拿。", "pinyin": "Shí bā kuài. Zhèlǐ yǒu shuǐ, qǐng zìjǐ ná.", "en": "Eighteen yuan. There's water here, help yourself.", "cue": "shuǐ"},
            {"who": "You", "hanzi": "好的。今天人很多。", "pinyin": "Hǎo de. Jīntiān rén hěn duō.", "en": "Okay. It's busy today.", "cue": "jīntiān"},
            {"who": "Barista", "hanzi": "是啊，早上大家都来喝咖啡。", "pinyin": "Shì a, zǎoshang dàjiā dōu lái hē kāfēi.", "en": "Yes, everyone comes for coffee in the morning.", "cue": "zǎoshang"},
        ],
        "choices": [
            {
                "after": 1,
                "prompt": "The barista waits. Choose your order.",
                "options": [
                    {"hanzi": "我要一杯茶。", "pinyin": "Wǒ yào yì bēi chá.", "en": "I'll have a tea.", "correct": False, "reply": "Barista: 当然可以。我们也有很好的茶。", "cue": "chá"},
                    {"hanzi": "我想要一杯咖啡。", "pinyin": "Wǒ xiǎng yào yì bēi kāfēi.", "en": "I'd like a coffee.", "correct": True, "reply": "Barista: 好的，马上来。", "cue": "kāfēi"},
                    {"hanzi": "我不饿。", "pinyin": "Wǒ bú è.", "en": "I'm not hungry.", "correct": False, "reply": "Barista: 好的……那你喝点什么？", "cue": "è"},
                ],
            },
            {
                "after": 3,
                "prompt": "She asks the price question before you do. Ask it yourself.",
                "options": [
                    {"hanzi": "多少钱？", "pinyin": "Duōshao qián?", "en": "How much is it?", "correct": True, "reply": "Barista: 十八块。", "cue": ""},
                    {"hanzi": "你叫什么？", "pinyin": "Nǐ jiào shénme?", "en": "What is your name?", "correct": False, "reply": "Barista: 我叫小林。", "cue": ""},
                    {"hanzi": "明天见。", "pinyin": "Míngtiān jiàn.", "en": "See you tomorrow.", "correct": False, "reply": "Barista: 明天见！", "cue": "míngtiān"},
                ],
            },
            {
                "after": 5,
                "prompt": "You want a seat. What do you say?",
                "options": [
                    {"hanzi": "我可以坐这里吗？", "pinyin": "Wǒ kěyǐ zuò zhèlǐ ma?", "en": "May I sit here?", "correct": True, "reply": "Barista: 可以，请坐。", "cue": "zuò"},
                    {"hanzi": "我要回家。", "pinyin": "Wǒ yào huí jiā.", "en": "I want to go home.", "correct": False, "reply": "Barista: 好的，慢走。", "cue": "jiā"},
                    {"hanzi": "这个字怎么读？", "pinyin": "Zhège zì zěnme dú?", "en": "How do you read this character?", "correct": False, "reply": "Barista: 哪个字？", "cue": "zì"},
                ],
            },
        ],
        "phrases": [
            {"hanzi": "我想要…", "pinyin": "Wǒ xiǎng yào…", "en": "I would like…", "cue": "xiǎng"},
            {"hanzi": "多少钱？", "pinyin": "Duōshao qián?", "en": "How much?", "cue": ""},
            {"hanzi": "请自己拿。", "pinyin": "Qǐng zìjǐ ná.", "en": "Help yourself.", "cue": ""},
        ],
    },
    {
        "slug": "friend",
        "title": "Meeting an Old Friend",
        "hanzi": "遇见朋友",
        "setting": "A university gate at dusk. Someone waves from across the road.",
        "description": "Greet a friend you have not seen for a year, and make a plan.",
        "level": 1,
        "accent": "lime",
        "dialogue": [
            {"who": "Lin", "hanzi": "小王！真的是你吗？", "pinyin": "Xiǎo Wáng! Zhēn de shì nǐ ma?", "en": "Xiao Wang! Is it really you?", "cue": ""},
            {"who": "You", "hanzi": "林！好久不见。", "pinyin": "Lín! Hǎojiǔ bú jiàn.", "en": "Lin! Long time no see.", "cue": ""},
            {"who": "Lin", "hanzi": "你什么时候来北京的？", "pinyin": "Nǐ shénme shíhou lái Běijīng de?", "en": "When did you come to Beijing?", "cue": "shíhou"},
            {"who": "You", "hanzi": "昨天。我要在这里学汉语。", "pinyin": "Zuótiān. Wǒ yào zài zhèlǐ xué Hànyǔ.", "en": "Yesterday. I'm here to study Chinese.", "cue": "zuótiān"},
            {"who": "Lin", "hanzi": "太好了！明天你有时间吗？", "pinyin": "Tài hǎo le! Míngtiān nǐ yǒu shíjiān ma?", "en": "Great! Do you have time tomorrow?", "cue": "míngtiān"},
            {"who": "You", "hanzi": "明天早上我有课。下午可以。", "pinyin": "Míngtiān zǎoshang wǒ yǒu kè. Xiàwǔ kěyǐ.", "en": "I have class tomorrow morning. Afternoon works.", "cue": "zǎoshang"},
            {"who": "Lin", "hanzi": "那我们下午去喝咖啡。", "pinyin": "Nà wǒmen xiàwǔ qù hē kāfēi.", "en": "Then let's get coffee in the afternoon.", "cue": "xiàwǔ"},
        ],
        "choices": [
            {
                "after": 1,
                "prompt": "How do you greet a friend after a long time?",
                "options": [
                    {"hanzi": "你好，我叫小王。", "pinyin": "Nǐ hǎo, wǒ jiào Xiǎo Wáng.", "en": "Hello, my name is Xiao Wang.", "correct": False, "reply": "Lin: 我知道你叫什么！", "cue": ""},
                    {"hanzi": "好久不见！", "pinyin": "Hǎojiǔ bú jiàn!", "en": "Long time no see!", "correct": True, "reply": "Lin: 是啊，一年了。", "cue": ""},
                    {"hanzi": "对不起。", "pinyin": "Duìbuqǐ.", "en": "Sorry.", "correct": False, "reply": "Lin: 为什么道歉？", "cue": ""},
                ],
            },
            {
                "after": 4,
                "prompt": "She proposes tomorrow. Answer honestly about your schedule.",
                "options": [
                    {"hanzi": "明天我很忙。", "pinyin": "Míngtiān wǒ hěn máng.", "en": "I'm busy tomorrow.", "correct": False, "reply": "Lin: 那后天呢？", "cue": "máng"},
                    {"hanzi": "明天下午可以。", "pinyin": "Míngtiān xiàwǔ kěyǐ.", "en": "Tomorrow afternoon works.", "correct": True, "reply": "Lin: 好，下午见。", "cue": "míngtiān"},
                    {"hanzi": "昨天可以。", "pinyin": "Zuótiān kěyǐ.", "en": "Yesterday works.", "correct": False, "reply": "Lin: 昨天已经过去了。", "cue": "zuótiān"},
                ],
            },
        ],
        "phrases": [
            {"hanzi": "好久不见。", "pinyin": "Hǎojiǔ bú jiàn.", "en": "Long time no see.", "cue": ""},
            {"hanzi": "你什么时候…？", "pinyin": "Nǐ shénme shíhou…?", "en": "When did you…?", "cue": "shíhou"},
            {"hanzi": "下午见。", "pinyin": "Xiàwǔ jiàn.", "en": "See you in the afternoon.", "cue": ""},
        ],
    },
    {
        "slug": "campus",
        "title": "First Day on Campus",
        "hanzi": "在大学",
        "setting": "A stone gateway, a map board, and a student with a folder.",
        "description": "Find your classroom, ask for directions, and meet a classmate.",
        "level": 2,
        "accent": "graphite",
        "dialogue": [
            {"who": "Student", "hanzi": "你好，你是新学生吗？", "pinyin": "Nǐ hǎo, nǐ shì xīn xuésheng ma?", "en": "Hi, are you a new student?", "cue": "xuésheng"},
            {"who": "You", "hanzi": "是，我在找教室。", "pinyin": "Shì, wǒ zài zhǎo jiàoshì.", "en": "Yes, I'm looking for the classroom.", "cue": ""},
            {"who": "Student", "hanzi": "教学楼在图书馆后面。", "pinyin": "Jiàoxuélóu zài túshūguǎn hòumiàn.", "en": "The teaching building is behind the library.", "cue": ""},
            {"who": "You", "hanzi": "远吗？", "pinyin": "Yuǎn ma?", "en": "Is it far?", "cue": "yuǎn"},
            {"who": "Student", "hanzi": "不远，走路五分钟。", "pinyin": "Bù yuǎn, zǒulù wǔ fēnzhōng.", "en": "Not far, a five-minute walk.", "cue": "zǒu"},
            {"who": "You", "hanzi": "谢谢。你也是学生吗？", "pinyin": "Xièxie. Nǐ yě shì xuésheng ma?", "en": "Thanks. Are you a student too?", "cue": ""},
            {"who": "Student", "hanzi": "是，我学汉语。我们一起走吧。", "pinyin": "Shì, wǒ xué Hànyǔ. Wǒmen yìqǐ zǒu ba.", "en": "Yes, I study Chinese. Let's walk together.", "cue": "xué"},
        ],
        "choices": [
            {
                "after": 1,
                "prompt": "Ask where the classroom is.",
                "options": [
                    {"hanzi": "教室在哪里？", "pinyin": "Jiàoshì zài nǎlǐ?", "en": "Where is the classroom?", "correct": True, "reply": "Student: 在教学楼里。", "cue": ""},
                    {"hanzi": "你吃饭了吗？", "pinyin": "Nǐ chīfàn le ma?", "en": "Have you eaten?", "correct": False, "reply": "Student: 吃了，谢谢。", "cue": "chī"},
                    {"hanzi": "这是什么字？", "pinyin": "Zhè shì shénme zì?", "en": "What character is this?", "correct": False, "reply": "Student: 这是「学」字。", "cue": "zì"},
                ],
            },
            {
                "after": 3,
                "prompt": "Confirm the distance before you walk.",
                "options": [
                    {"hanzi": "远吗？", "pinyin": "Yuǎn ma?", "en": "Is it far?", "correct": True, "reply": "Student: 不远，走路五分钟。", "cue": "yuǎn"},
                    {"hanzi": "你忙吗？", "pinyin": "Nǐ máng ma?", "en": "Are you busy?", "correct": False, "reply": "Student: 现在不忙。", "cue": "máng"},
                    {"hanzi": "多少钱？", "pinyin": "Duōshao qián?", "en": "How much?", "correct": False, "reply": "Student: 什么多少钱？", "cue": ""},
                ],
            },
            {
                "after": 5,
                "prompt": "You want to walk together. Invite him.",
                "options": [
                    {"hanzi": "我们一起走吧。", "pinyin": "Wǒmen yìqǐ zǒu ba.", "en": "Let's walk together.", "correct": True, "reply": "Student: 好啊，走吧。", "cue": "zǒu"},
                    {"hanzi": "我想回家。", "pinyin": "Wǒ xiǎng huí jiā.", "en": "I want to go home.", "correct": False, "reply": "Student: 好的，再见。", "cue": "jiā"},
                    {"hanzi": "我不认识你。", "pinyin": "Wǒ bú rènshi nǐ.", "en": "I don't know you.", "correct": False, "reply": "Student: 我们刚认识。", "cue": "rènshi"},
                ],
            },
        ],
        "phrases": [
            {"hanzi": "在哪里？", "pinyin": "Zài nǎlǐ?", "en": "Where is it?", "cue": ""},
            {"hanzi": "远吗？", "pinyin": "Yuǎn ma?", "en": "Is it far?", "cue": "yuǎn"},
            {"hanzi": "我们一起走吧。", "pinyin": "Wǒmen yìqǐ zǒu ba.", "en": "Let's go together.", "cue": "zǒu"},
        ],
    },
    {
        "slug": "metro",
        "title": "The Last Train",
        "hanzi": "坐地铁",
        "setting": "Line 10, 22:50. The platform is nearly empty.",
        "description": "Buy a ticket, read the map, and make the last connection.",
        "level": 2,
        "accent": "lime",
        "dialogue": [
            {"who": "You", "hanzi": "请问，去北京站怎么坐地铁？", "pinyin": "Qǐngwèn, qù Běijīng Zhàn zěnme zuò dìtiě?", "en": "Excuse me, how do I get to Beijing Station by subway?", "cue": "dìtiě"},
            {"who": "Staff", "hanzi": "坐十号线，在国贸换一号线。", "pinyin": "Zuò shí hào xiàn, zài Guómào huàn yī hào xiàn.", "en": "Take Line 10, change to Line 1 at Guomao.", "cue": ""},
            {"who": "You", "hanzi": "要多久？", "pinyin": "Yào duōjiǔ?", "en": "How long does it take?", "cue": ""},
            {"who": "Staff", "hanzi": "四十分钟左右。最后一班车快到了。", "pinyin": "Sìshí fēnzhōng zuǒyòu. Zuìhòu yì bān chē kuài dào le.", "en": "About forty minutes. The last train is arriving soon.", "cue": ""},
            {"who": "You", "hanzi": "谢谢！地铁站里有水吗？", "pinyin": "Xièxie! Dìtiě zhàn lǐ yǒu shuǐ ma?", "en": "Thanks! Is there water in the station?", "cue": "shuǐ"},
            {"who": "Staff", "hanzi": "有，那边有一个小店。", "pinyin": "Yǒu, nàbiān yǒu yí ge xiǎo diàn.", "en": "Yes, there's a small shop over there.", "cue": ""},
            {"who": "You", "hanzi": "好的，我现在去买。", "pinyin": "Hǎo de, wǒ xiànzài qù mǎi.", "en": "Okay, I'll go buy some now.", "cue": "xiànzài"},
        ],
        "choices": [
            {
                "after": 1,
                "prompt": "Ask how long the journey takes.",
                "options": [
                    {"hanzi": "要多久？", "pinyin": "Yào duōjiǔ?", "en": "How long does it take?", "correct": True, "reply": "Staff: 四十分钟左右。", "cue": ""},
                    {"hanzi": "你叫什么？", "pinyin": "Nǐ jiào shénme?", "en": "What's your name?", "correct": False, "reply": "Staff: 我叫小李。", "cue": ""},
                    {"hanzi": "今天星期几？", "pinyin": "Jīntiān xīngqī jǐ?", "en": "What day is it today?", "correct": False, "reply": "Staff: 星期五。", "cue": "jīntiān"},
                ],
            },
            {
                "after": 4,
                "prompt": "You need water. Ask politely.",
                "options": [
                    {"hanzi": "这里有水吗？", "pinyin": "Zhèlǐ yǒu shuǐ ma?", "en": "Is there water here?", "correct": True, "reply": "Staff: 有，那边有一个小店。", "cue": "shuǐ"},
                    {"hanzi": "这里有火吗？", "pinyin": "Zhèlǐ yǒu huǒ ma?", "en": "Is there fire here?", "correct": False, "reply": "Staff: 地铁里不能有火！", "cue": "huǒ"},
                    {"hanzi": "我要回家。", "pinyin": "Wǒ yào huí jiā.", "en": "I want to go home.", "correct": False, "reply": "Staff: 那快上车吧。", "cue": "jiā"},
                ],
            },
        ],
        "phrases": [
            {"hanzi": "怎么坐地铁？", "pinyin": "Zěnme zuò dìtiě?", "en": "How do I take the subway?", "cue": "dìtiě"},
            {"hanzi": "要多久？", "pinyin": "Yào duōjiǔ?", "en": "How long does it take?", "cue": ""},
            {"hanzi": "最后一班车", "pinyin": "Zuìhòu yì bān chē", "en": "The last train", "cue": ""},
        ],
    },
]

SOUND_SETS = [
    {
        "slug": "tones",
        "title": "Four Tones, One Syllable",
        "kind": "tone",
        "description": "The same syllable ma, four pitch movements, four meanings. Listen for the contour, not the letters.",
        "items": [
            {"hanzi": "妈", "pinyin": "mā", "tone": 1, "meaning": "mother", "contour": [5, 5, 5, 5], "note": "High and level."},
            {"hanzi": "麻", "pinyin": "má", "tone": 2, "meaning": "hemp", "contour": [3, 3.6, 4.3, 5], "note": "Rising, like a question."},
            {"hanzi": "马", "pinyin": "mǎ", "tone": 3, "meaning": "horse", "contour": [3, 1.8, 1.2, 2.4], "note": "Dips low, then lifts."},
            {"hanzi": "骂", "pinyin": "mà", "tone": 4, "meaning": "to scold", "contour": [5, 4.2, 3.1, 1.4], "note": "Sharp fall from high."},
        ],
    },
    {
        "slug": "minimal-pairs",
        "title": "Minimal Pairs",
        "kind": "pair",
        "description": "Pairs that differ by one sound. If you can hear the difference, you can say it.",
        "items": [
            {"a": "四", "a_pinyin": "sì", "a_en": "four", "b": "十", "b_pinyin": "shí", "b_en": "ten", "focus": "s / sh", "cue": "sì, shí"},
            {"a": "是", "a_pinyin": "shì", "a_en": "to be", "b": "师", "b_pinyin": "shī", "b_en": "teacher (bound)", "focus": "tone 4 / tone 1", "cue": "shì, shī"},
            {"a": "吃", "a_pinyin": "chī", "a_en": "to eat", "b": "池", "b_pinyin": "chí", "b_en": "pond", "focus": "tone 1 / tone 2", "cue": "chī, chí"},
            {"a": "买", "a_pinyin": "mǎi", "a_en": "to buy", "b": "卖", "b_pinyin": "mài", "b_en": "to sell", "focus": "tone 3 / tone 4", "cue": "mǎi, mài"},
        ],
    },
    {
        "slug": "sentences",
        "title": "Sentence Listening",
        "kind": "sentence",
        "description": "Full sentences from the scenarios. Catch the time word, then catch the verb.",
        "items": [
            {"hanzi": "我每天坐地铁去学校。", "pinyin": "Wǒ měitiān zuò dìtiě qù xuéxiào.", "en": "I take the subway to school every day.", "focus": "每天 / 地铁 / 学校", "cue": "Wǒ měitiān zuò dìtiě qù xuéxiào."},
            {"hanzi": "明天下午你有时间吗？", "pinyin": "Míngtiān xiàwǔ nǐ yǒu shíjiān ma?", "en": "Do you have time tomorrow afternoon?", "focus": "明天 / 时间", "cue": "Míngtiān xiàwǔ nǐ yǒu shíjiān ma?"},
            {"hanzi": "请给我一杯咖啡。", "pinyin": "Qǐng gěi wǒ yì bēi kāfēi.", "en": "Please give me a coffee.", "focus": "给 / 咖啡", "cue": "Qǐng gěi wǒ yì bēi kāfēi."},
            {"hanzi": "我认识他，但是不知道他的名字。", "pinyin": "Wǒ rènshi tā, dànshì bù zhīdào tā de míngzi.", "en": "I know him, but I don't know his name.", "focus": "认识 / 知道", "cue": "Wǒ rènshi tā, dànshì bù zhīdào tā de míngzi."},
        ],
    },
]

CHAR_META = [
    ("时", "shí", "time; when", "日", 7, "left-right", "日 寸", "日 (sun) beside 寸 (a hand measuring): the sun measured out, hence time.",
     "The modern simplified form keeps 日 on the left."),
    ("间", "jiān", "interval; between", "门", 7, "enclosure", "门 日", "A sun (日) seen through a gate (门): the gap between, hence interval.",
     "门 encloses 日; the light through a doorway marks a span of time."),
    ("天", "tiān", "sky; day", "大", 4, "single", "大 一", "A person (大) with a line above: what is above the human, the sky.",
     "The top stroke is the sky; the figure below is a person."),
    ("明", "míng", "bright", "日", 8, "left-right", "日 月", "Sun and moon together: the two sources of light, hence bright.",
     "明天 = the next bright day."),
    ("好", "hǎo", "good", "女", 6, "left-right", "女 子", "A woman and a child: an ancient image of a good household.",
     "女 on the left, 子 on the right."),
    ("学", "xué", "to learn", "子", 8, "top-bottom", "⺍ 冖 子", "A child under a roof, with hands above: learning.",
     "The 子 at the bottom is the child who learns."),
    ("家", "jiā", "home", "宀", 10, "top-bottom", "宀 豕", "A roof (宀) over a pig (豕): shelter and livestock, a household.",
     "The 宀 roof also appears on 字, 安, 客."),
    ("水", "shuǐ", "water", "水", 4, "single", "水", "A stream with a main current and two banks.",
     "As a left radical it becomes 氵, as in 汉 and 海."),
    ("木", "mù", "tree; wood", "木", 4, "single", "木", "A tree: trunk, roots, branches.",
     "Two trees make 林; three make 森."),
    ("火", "huǒ", "fire", "火", 4, "single", "火", "A flame with two sparks at its sides.",
     "As a bottom radical it becomes 灬, as in 热."),
    ("心", "xīn", "heart; mind", "心", 4, "single", "心", "A picture of the heart, with its chambers and vessels.",
     "As a left radical it becomes 忄, as in 忙."),
    ("字", "zì", "character", "子", 6, "top-bottom", "宀 子", "A child under a roof: a character taught and raised at home.",
     "宀 + 子, the same 子 as in 孩子 and 学."),
]


# Bump when the shared content changes so an existing deployment refreshes it
# once instead of on every cold start.
CONTENT_VERSION = "2026-11-11.1"

WORD_COLUMNS = """(hanzi, pinyin, meaning, category, hsk, radical, strokes, components,
                   example, example_pinyin, example_en, note)"""

WORDS_UPSERT = f"""INSERT INTO words {WORD_COLUMNS}
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
                    ON CONFLICT(hanzi) DO NOTHING"""

RELATIONS_INSERT = """INSERT INTO relations (source_id, target_id, type, note, strength)
                      VALUES (?,?,?,?,?)
                      ON CONFLICT(source_id, target_id, type) DO NOTHING"""

CHAR_META_UPSERT = """INSERT INTO char_meta
                      (char, pinyin, meaning, radical, strokes, structure, components, origin, hint)
                      VALUES (?,?,?,?,?,?,?,?,?)
                      ON CONFLICT(char) DO UPDATE SET
                        pinyin=excluded.pinyin, meaning=excluded.meaning,
                        radical=excluded.radical, strokes=excluded.strokes,
                        structure=excluded.structure, components=excluded.components,
                        origin=excluded.origin, hint=excluded.hint"""

SCENARIOS_UPSERT = """INSERT INTO scenarios
                      (slug, title, hanzi, setting, description, level, accent, dialogue, choices, phrases)
                      VALUES (?,?,?,?,?,?,?,?,?,?)
                      ON CONFLICT(slug) DO UPDATE SET
                        title=excluded.title, hanzi=excluded.hanzi, setting=excluded.setting,
                        description=excluded.description, level=excluded.level,
                        accent=excluded.accent, dialogue=excluded.dialogue,
                        choices=excluded.choices, phrases=excluded.phrases"""

SOUND_SETS_UPSERT = """INSERT INTO sound_sets (slug, title, kind, description, items)
                       VALUES (?,?,?,?,?)
                       ON CONFLICT(slug) DO UPDATE SET
                         title=excluded.title, kind=excluded.kind,
                         description=excluded.description, items=excluded.items"""


def _word_ids(conn) -> dict[str, int]:
    return {
        row[0]: row[1]
        for row in conn.execute("SELECT hanzi, id FROM words").fetchall()
    }


def _relation_rows(ids: dict[str, int]) -> list[tuple]:
    """Every relation in both directions, de-duplicated by the unique index."""
    by_hanzi = {w[0]: w for w in WORDS}
    rows: list[tuple] = []
    for a, b, rtype, note, strength in RELATIONS:
        if a not in ids or b not in ids or a == b:
            continue
        rows.append((ids[a], ids[b], rtype, note, strength))
        rows.append((ids[b], ids[a], rtype, note, strength))

    # Derived component edges: only when the component is itself a word.
    for hanzi, wid in ids.items():
        meta = by_hanzi.get(hanzi)
        if not meta:
            continue
        for comp in meta[7].split():
            if comp in ids and comp != hanzi:
                rows.append((wid, ids[comp], "component",
                             f"{hanzi} contains the character {comp}.", 4))
                rows.append((ids[comp], wid, "component",
                             f"{comp} is a component of {hanzi}.", 4))
    return rows


def _scenario_rows() -> list[tuple]:
    return [
        (s["slug"], s["title"], s["hanzi"], s["setting"], s["description"],
         s["level"], s["accent"], json.dumps(s["dialogue"], ensure_ascii=False),
         json.dumps(s["choices"], ensure_ascii=False),
         json.dumps(s["phrases"], ensure_ascii=False))
        for s in SCENARIOS
    ]


def _sound_set_rows() -> list[tuple]:
    return [
        (s["slug"], s["title"], s["kind"], s["description"],
         json.dumps(s["items"], ensure_ascii=False))
        for s in SOUND_SETS
    ]


def seed(conn) -> None:
    """Populate the shared content of an empty database.

    Accounts and learner progress are intentionally not seeded. Every visitor
    starts with an empty archive after registering.

    Bulk inserts keep a first-run seed to a handful of round trips, which
    matters when the database is a hosted PostgreSQL instance.
    """
    conn.executemany(WORDS_UPSERT, WORDS)
    ids = _word_ids(conn)

    conn.executemany(RELATIONS_INSERT, _relation_rows(ids))
    conn.executemany(CHAR_META_UPSERT, CHAR_META)
    conn.executemany(SCENARIOS_UPSERT, _scenario_rows())
    conn.executemany(SOUND_SETS_UPSERT, _sound_set_rows())
    conn.commit()


def sync_content(conn) -> int:
    """Add new words and relations to an existing archive.

    Idempotent: existing rows keep their ids, progress and discoveries. Only
    missing vocabulary and edges are inserted. Returns the number of new words.
    """
    existing = _word_ids(conn)
    updates = []
    inserts = []
    for w in WORDS:
        if w[0] in existing:
            updates.append((w[1], w[2], w[3], w[4], w[8], w[9], w[10], w[11],
                            existing[w[0]]))
            continue
        inserts.append(w)

    if updates:
        conn.executemany(
            """UPDATE words SET pinyin=?, meaning=?, category=?, hsk=?,
               example=?, example_pinyin=?, example_en=?, note=?
               WHERE id=?""",
            updates,
        )
    if inserts:
        conn.executemany(WORDS_UPSERT, inserts)
        existing = _word_ids(conn)

    conn.executemany(RELATIONS_INSERT, _relation_rows(existing))
    conn.executemany(CHAR_META_UPSERT, CHAR_META)
    conn.executemany(SCENARIOS_UPSERT, _scenario_rows())
    conn.executemany(SOUND_SETS_UPSERT, _sound_set_rows())
    conn.commit()
    return len(inserts)
