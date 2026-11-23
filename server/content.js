/**
 * Studio content — the free, offline-safe backbone of Daymark.
 * AI can create fresh material when a Gemini key is connected. These curated
 * pieces keep every feature useful without a key and give the demo its voice.
 */

const READING_BANK = [
  {
    slug: "city-trees",
    level: "5-6",
    style: "editorial",
    topic: "Cities & nature",
    title: "The City That Learned to Listen to Its Trees",
    subtitle:
      "In one Singapore neighbourhood, planners swapped car lanes for canopy. The results changed how residents move — and how they think about heat.",
    minutes: 6,
    paragraphs: [
      "On a Tuesday morning in Singapore's Bukit Timah, the loudest sound is leaves. Ten years ago, this street had four lanes of traffic and almost no shade. Today, a canopy of rain trees stretches over a single lane, and office workers walk beneath it to the MRT station. \u201cWe used to run from air-conditioned place to air-conditioned place,\u201d says retail manager Lim Wei. \u201cNow I take the long way.\u201d",
      "The change began in 2014, when the district council faced a stubborn problem: summer temperatures were climbing, and elderly residents were avoiding outdoor spaces. Instead of adding more air conditioning, planners studied how shade and water could cool a street. They removed two traffic lanes, planted 180 native trees, and added small pocket parks with rain gardens. Sensors now measure temperature, humidity and foot traffic.",
      "The results have been modest but meaningful. On hot afternoons, surface temperatures under the new canopy can be up to 4\u00b0C lower than on nearby exposed roads. Shops along the street report slightly more customers on weekends, while air pollution has fallen because fewer cars use the route. The project cost about S$3.4 million \u2014 far less than a large indoor mall, and it serves everyone.",
      "Not everyone welcomed the change. Drivers complained about longer journeys, and some shopkeepers feared losing delivery access. The council responded with loading bays and a new bus service. Six years on, resistance has mostly faded. \u201cA street is not just a pipe for cars,\u201d says urban ecologist Dr Nadia Rahman. \u201cIt is a living room, a corridor and a habitat. When you design for the slowest person, everyone benefits.\u201d",
      "The project is now part of a larger plan to weave green corridors across the island. It is a reminder that climate adaptation is often less about technology than about attention: noticing where heat collects, who avoids the street, and what a city sounds like when traffic gives way to birds."
    ],
    glossary: [
      {
        word: "canopy",
        phonetic: "/\u02c8k\u00e6n\u0259pi/",
        pos: "noun",
        definition: "a roof-like covering, especially one formed by the branches and leaves of trees",
        example: "We ate lunch in the shade of the chestnut canopy."
      },
      {
        word: "stubborn",
        phonetic: "/\u02c8st\u028cb\u0259n/",
        pos: "adjective",
        definition: "difficult to deal with or change",
        example: "The council struggled with a stubborn shortage of affordable homes."
      },
      {
        word: "native",
        phonetic: "/\u02c8ne\u026at\u026av/",
        pos: "adjective",
        definition: "growing, living or existing naturally in a particular place",
        example: "The garden is planted with native wildflowers that need little water."
      },
      {
        word: "humidity",
        phonetic: "/hju\u02d0\u02c8m\u026ad\u0259ti/",
        pos: "noun",
        definition: "the amount of water vapour in the air",
        example: "The high humidity made the afternoon feel even hotter."
      },
      {
        word: "exposed",
        phonetic: "/\u026ak\u02c8sp\u0259\u028azd/",
        pos: "adjective",
        definition: "not protected or covered from the weather or from harm",
        example: "Walkers on the exposed ridge had no shelter from the wind."
      },
      {
        word: "resistance",
        phonetic: "/r\u026a\u02c8z\u026ast\u0259ns/",
        pos: "noun",
        definition: "refusal to accept or agree with a change or idea",
        example: "There was little resistance to the plan once the benefits were explained."
      },
      {
        word: "habitat",
        phonetic: "/\u02c8h\u00e6b\u026at\u00e6t/",
        pos: "noun",
        definition: "the natural home of a plant or animal",
        example: "The wetland provides a habitat for rare birds."
      },
      {
        word: "adaptation",
        phonetic: "/\u02cc\u00e6d\u00e6p\u02c8te\u026a\u0283n/",
        pos: "noun",
        definition: "the process of changing in order to suit new conditions",
        example: "The city's climate adaptation plan includes more trees and fewer car lanes."
      }
    ],
    questions: [
      {
        question: "What was the main reason the district council changed the street?",
        options: [
          "To reduce the number of traffic accidents",
          "To make a hot area more comfortable for residents",
          "To attract international tourists",
          "To create more parking spaces"
        ],
        answer: 1,
        explanation:
          "Paragraph 2 says temperatures were climbing and elderly residents were avoiding outdoor spaces. The shade and rain gardens were designed to cool the street."
      },
      {
        question: "Which benefit of the project is mentioned in the passage?",
        options: [
          "Every shop on the street doubled its sales",
          "Traffic disappeared completely",
          "Surface temperatures under the trees can be up to 4\u00b0C lower",
          "The project cost less than S$1 million"
        ],
        answer: 2,
        explanation:
          "Paragraph 3 compares temperatures under the canopy with nearby exposed roads. The passage says shops reported only 'slightly more customers' and costs were S$3.4 million."
      },
      {
        question: "What does Dr Nadia Rahman's quote suggest about good street design?",
        options: [
          "It should mainly make life easier for drivers",
          "It should be left to climate scientists",
          "It should work well for the people who need the most support",
          "It should include more indoor shopping centres"
        ],
        answer: 2,
        explanation:
          "'When you design for the slowest person, everyone benefits' implies that designing for the most vulnerable users creates better public spaces for all."
      }
    ]
  },
  {
    slug: "night-train",
    level: "5-6",
    style: "story",
    topic: "People & everyday life",
    title: "The Ticket, the Rain and the Stranger",
    subtitle:
      "A forgotten wallet, a missed train and a line of poetry change the shape of Nia's week.",
    minutes: 5,
    paragraphs: [
      "The rain had been falling since dawn, and Nia was already late. She ran up the steps of Platform Four, her folder pressed against her coat, and reached the ticket barrier just as the 8:12 pulled away. Only then did she notice the empty pocket where her wallet should have been.",
      "She rummaged through her bag twice, then a third time, as though the wallet might appear out of politeness. Her interview was in forty minutes. The station was filling with commuters, and the queue behind her had begun to sigh.",
      "\u201cForgotten something?\u201d The voice came from an elderly woman in a green raincoat. Nia explained, too quickly, that she lived twenty minutes away and could not possibly get home and back in time. The woman opened her purse without ceremony and paid for Nia's ticket. When Nia began to protest, she held up a hand. \u201cPay it forward,\u201d she said. \u201cThat is the whole system.\u201d",
      "On the train, Nia found a scrap of paper tucked into her ticket sleeve. The woman had written a line in careful blue ink: Some mornings are for arriving. Others are for noticing. Beneath it was a small drawing of a bird. Nia laughed out loud, and the man beside her looked up from his phone.",
      "She arrived at the office with three minutes to spare. The interview felt less like an examination than a conversation, perhaps because she had already been reminded that strangers can be generous. That evening, she wrote the woman a thank-you note and left it at the station desk, addressed simply to \u201cthe lady in the green raincoat.\u201d",
      "Three weeks later, Nia got the job. On her first Monday, she saw a young man at Platform Four counting coins in his palm while a train pulled out. She bought two tickets and handed one to him. In his confusion, she said the only thing that made sense: \u201cPay it forward. That is the whole system.\u201d"
    ],
    glossary: [
      {
        word: "commuter",
        phonetic: "/k\u0259\u02c8mju\u02d0t\u0259/",
        pos: "noun",
        definition: "a person who travels regularly between home and work",
        example: "The station is busiest when commuters head home after five."
      },
      {
        word: "rummage",
        phonetic: "/\u02c8r\u028cm\u026ad\u0292/",
        pos: "verb",
        definition: "to search untidily through a container or collection of things",
        example: "She rummaged through the drawer for her keys."
      },
      {
        word: "protest",
        phonetic: "/pr\u0259\u02c8test/",
        pos: "verb",
        definition: "to say or show that you disagree with something",
        example: "He protested when the cafe raised its prices again."
      },
      {
        word: "scrap",
        phonetic: "/skr\u00e6p/",
        pos: "noun",
        definition: "a small piece of paper, cloth or other material",
        example: "He wrote the address on a scrap of paper."
      },
      {
        word: "generous",
        phonetic: "/\u02c8d\u0292en\u0259r\u0259s/",
        pos: "adjective",
        definition: "willing to give money, help or time freely",
        example: "A generous neighbour lent us her ladder."
      },
      {
        word: "ceremony",
        phonetic: "/\u02c8ser\u0259m\u0259ni/",
        pos: "noun",
        definition: "formal or carefully performed behaviour",
        example: "He opened the envelope without ceremony."
      }
    ],
    questions: [
      {
        question: "Why does the woman pay for Nia's ticket?",
        options: [
          "She recognises Nia from the interview office",
          "She wants Nia to pay her back the next day",
          "She sees that Nia is in trouble and helps without fuss",
          "She is trying to sell Nia a weekly travel pass"
        ],
        answer: 2,
        explanation:
          "The woman opens her purse 'without ceremony' and refuses Nia's protests. Her motive is simple kindness, not repayment or recognition."
      },
      {
        question: "Why does Nia laugh on the train?",
        options: [
          "She realises she has missed her interview",
          "The stranger's note is unexpectedly playful and kind",
          "Another passenger tells her a joke",
          "She finds her wallet in her folder"
        ],
        answer: 1,
        explanation:
          "Nia finds a handwritten line of poetry and a small drawing of a bird. After a stressful morning, its unexpected warmth makes her laugh."
      },
      {
        question: "What is the best summary of the story's message?",
        options: [
          "Interviews are easier when you arrive early",
          "Kindness can travel from one stranger to another",
          "It is safer to carry your wallet in your pocket",
          "People in cities are usually too busy to help"
        ],
        answer: 1,
        explanation:
          "Nia's final gesture repeats the stranger's words and passes the kindness on, showing how a small act can travel."
      }
    ]
  },
  {
    slug: "notified-mind",
    level: "6-7",
    style: "academic article",
    topic: "Technology & attention",
    title: "The Quiet Cost of a Notified Mind",
    subtitle:
      "Researchers are learning that what interrupts us matters as much as how often. The bill is paid in a currency we rarely count.",
    minutes: 7,
    paragraphs: [
      "The modern office rarely falls silent. A message arrives with a soft chime; a calendar reminder slides across the screen; someone lingers by a desk to ask a question that is not quite quick. Individually, these moments seem trivial. Collectively, they may be one of the most expensive features of contemporary work.",
      "Psychologists have a term for what happens next: attention residue. When people switch from one task to another, part of their mind remains oriented towards the unfinished first task. In a series of studies, Sophie Leroy and her colleagues found that participants who were interrupted while working on a challenging problem performed worse on the following task, even when they believed they had moved on. The residue was not visible to them. It was measurable all the same.",
      "The damage is not simply a matter of lost minutes. Sustained attention is a skill, and like most skills it responds to practice. A day spent flicking between windows trains the mind to expect interruption; a morning spent on one difficult question trains it to tolerate uncertainty. Over time, the environment we choose quietly selects which version of us shows up.",
      "This makes the familiar advice \u2014 turn off notifications, try harder, be more disciplined \u2014 feel both reasonable and inadequate. Willpower is a fragile defence against a system engineered to demand response. A notification is not merely an offer of information. It is a small social obligation, carrying the implicit question: what if this matters? The rational answer is almost always not now. The anxious brain hears maybe.",
      "Some organisations have begun to treat attention as infrastructure rather than a personal virtue. They batch messages into predictable windows, mark meetings as optional by default, and protect long blocks of uninterrupted work. The results are not utopian; the inbox still fills. But the baseline shifts. When silence becomes normal, people stop apologising for it \u2014 and start protecting it.",
      "Attention is not a resource we spend so much as a world we inhabit. The question is not whether we can afford a few more interruptions. It is what kind of thinking becomes possible when we do not have them."
    ],
    glossary: [
      {
        word: "residue",
        phonetic: "/\u02c8rez\u026adju\u02d0/",
        pos: "noun",
        definition: "something that remains after the main part has gone",
        example: "A residue of doubt remained after the meeting."
      },
      {
        word: "oriented",
        phonetic: "/\u02c8\u0254\u02d0rient\u026ad/",
        pos: "adjective",
        definition: "directed towards or interested in a particular thing",
        example: "The team is oriented towards long-term solutions."
      },
      {
        word: "sustained",
        phonetic: "/s\u0259\u02c8ste\u026and/",
        pos: "adjective",
        definition: "continuing for a long period without interruption",
        example: "Sustained effort is more useful than a single burst of activity."
      },
      {
        word: "inadequate",
        phonetic: "/\u026an\u02c8\u00e6d\u026akw\u0259t/",
        pos: "adjective",
        definition: "not good enough for a particular purpose",
        example: "The lighting was inadequate for reading."
      },
      {
        word: "implicit",
        phonetic: "/\u026am\u02c8pl\u026as\u026at/",
        pos: "adjective",
        definition: "suggested but not stated directly",
        example: "There was an implicit expectation to answer emails at weekends."
      },
      {
        word: "infrastructure",
        phonetic: "/\u02c8\u026anfr\u0259str\u028ckt\u0283\u0259/",
        pos: "noun",
        definition: "the basic systems and structures a society or organisation needs to function",
        example: "Reliable public transport is essential urban infrastructure."
      },
      {
        word: "interruption",
        phonetic: "/\u02cc\u026ant\u0259\u02c8r\u028cp\u0283n/",
        pos: "noun",
        definition: "something that temporarily stops an activity",
        example: "A phone call was an unwelcome interruption to the lesson."
      },
      {
        word: "virtue",
        phonetic: "/\u02c8v\u025c\u02d0t\u0283u\u02d0/",
        pos: "noun",
        definition: "a good or desirable quality; moral goodness",
        example: "Patience is a virtue in slow-moving negotiations."
      }
    ],
    questions: [
      {
        question: "What is 'attention residue' as described in the passage?",
        options: [
          "The physical tiredness caused by looking at a screen",
          "The part of the mind that stays with a previous task after switching",
          "A technique for remembering notifications",
          "The extra time needed to finish an interrupted email"
        ],
        answer: 1,
        explanation:
          "Paragraph 2 explains that part of the mind remains 'oriented towards the unfinished first task' and affects performance on the next task."
      },
      {
        question: "Why does the author describe notifications as a 'small social obligation'?",
        options: [
          "Because they always come from senior colleagues",
          "Because they require an immediate legal response",
          "Because they imply that someone expects us to respond",
          "Because they improve our relationships when ignored"
        ],
        answer: 2,
        explanation:
          "The passage says a notification carries the implicit question 'what if this matters?', creating a sense that someone is waiting or expecting a response."
      },
      {
        question: "Which statement best captures the author's view of willpower?",
        options: [
          "It is the only reliable solution to distraction",
          "It is useful but too weak to counter a system built around interruption",
          "It is a myth invented by psychologists",
          "It becomes stronger when notifications are turned on"
        ],
        answer: 1,
        explanation:
          "The author calls willpower 'a fragile defence against a system engineered to demand response', while still acknowledging that turning off notifications helps."
      },
      {
        question: "The tone of the final paragraph is best described as",
        options: [
          "playful and light-hearted",
          "angry and accusatory",
          "reflective and quietly urgent",
          "neutral and purely descriptive"
        ],
        answer: 2,
        explanation:
          "The metaphor of attention as a world to inhabit and the closing rhetorical question invite reflection and imply urgency without direct accusation."
      }
    ]
  },
  {
    slug: "sea-meadow",
    level: "6-7",
    style: "news",
    topic: "Science & environment",
    title: "The Sea Meadow That Came Back",
    subtitle:
      "After a century of loss, a quiet restoration project off the Welsh coast is bringing seagrass \u2014 and its residents \u2014 home.",
    minutes: 7,
    paragraphs: [
      "From the deck of a small research boat, the sea looks like a sheet of grey glass. Beneath it, however, lies a meadow. Ribbons of seagrass sway in the current, forming a dense underwater lawn that shelters crabs, pipefish and juvenile cod. Until recently, this patch off the coast of Pembrokeshire was bare sand.",
      "Seagrass meadows are among the most productive habitats on Earth. They stabilise sediment, improve water clarity and store carbon in the seabed at rates that can rival forests on land. Yet an estimated 92 per cent of Britain's seagrass has disappeared over the past century, damaged by dredging, pollution, coastal construction and a wasting disease that swept through beds in the 1930s.",
      "The restoration project began with a modest experiment. Divers collected seeds from healthy meadows and grew them in tanks before anchoring small biodegradable mats, each carrying a few hundred shoots, to the seabed. The first season looked like failure: storms buried some mats and a run of unusually warm water stressed the young plants. \u201cWe lost about 60 per cent,\u201d says marine ecologist Dr Elin Vaughan. \u201cBut the 40 per cent that survived were tough. We learned to work with the site instead of against it.\u201d",
      "Four years later, the meadow covers roughly two hectares and is expanding on its own. Fish surveys have recorded more than twice the number of species found in nearby bare sand. The project team is careful not to overstate the result. Two hectares is tiny compared with the historic loss, and restoration cannot substitute for protecting existing beds. \u201cThe real win is not the grass,\u201d Vaughan says. \u201cIt is the proof that this coast can recover if we remove the pressure.\u201d",
      "The next phase will involve local fishers, who have an interest in healthier fish stocks, and schools that will monitor the meadow through the year. The work is slow, quiet and difficult to photograph. That may be part of its value: it asks people to care about a landscape they cannot easily see, for benefits that will be measured in decades rather than headlines."
    ],
    glossary: [
      {
        word: "habitat",
        phonetic: "/\u02c8h\u00e6b\u026at\u00e6t/",
        pos: "noun",
        definition: "the natural environment in which a species lives",
        example: "The reef is a vital habitat for hundreds of species."
      },
      {
        word: "sediment",
        phonetic: "/\u02c8sed\u026am\u0259nt/",
        pos: "noun",
        definition: "solid material such as sand or mud that settles at the bottom of water",
        example: "Dredging stirred up sediment and clouded the water."
      },
      {
        word: "biodegradable",
        phonetic: "/\u02ccba\u026a\u0259\u028ad\u026a\u02c8\u0261re\u026ad\u0259bl/",
        pos: "adjective",
        definition: "able to decay naturally without harming the environment",
        example: "The mats are made from biodegradable fibres."
      },
      {
        word: "dredging",
        phonetic: "/\u02c8dred\u0292\u026a\u014b/",
        pos: "noun",
        definition: "the removal of material from the bottom of a river or sea",
        example: "Dredging can destroy fragile underwater plants."
      },
      {
        word: "stabilise",
        phonetic: "/\u02c8ste\u026ab\u0259la\u026az/",
        pos: "verb",
        definition: "to make something firm, steady or unlikely to change",
        example: "The roots stabilise the sand and prevent erosion."
      },
      {
        word: "substitute",
        phonetic: "/\u02c8s\u028cbst\u026atju\u02d0t/",
        pos: "verb",
        definition: "to use something in place of something else",
        example: "No amount of new planting can substitute for protecting old forest."
      },
      {
        word: "overstate",
        phonetic: "/\u02cc\u0259\u028av\u0259\u02c8ste\u026at/",
        pos: "verb",
        definition: "to describe something as larger or more important than it really is",
        example: "It is hard to overstate the importance of clean water."
      }
    ],
    questions: [
      {
        question: "What was the initial result of planting the seagrass mats?",
        options: [
          "All the mats were destroyed in the first week",
          "About 60 per cent of the plants were lost, but the survivors were resilient",
          "The meadow doubled in size within a season",
          "Fish numbers immediately fell"
        ],
        answer: 1,
        explanation:
          "Paragraph 3 reports the loss of about 60 per cent and notes that the 40 per cent which survived were 'tough'."
      },
      {
        question: "Why does Dr Vaughan say the 'real win is not the grass'?",
        options: [
          "The grass is not actually seagrass",
          "The value lies in showing that the coast can recover when pressures are removed",
          "The project has failed to attract local interest",
          "Fish are more important than plants"
        ],
        answer: 1,
        explanation:
          "She explains that the real victory is proof of recovery, not just the two hectares of meadow."
      },
      {
        question: "Which limitation of the project is acknowledged?",
        options: [
          "Seagrass has no environmental benefits",
          "The restored area is small compared with the historic loss",
          "Local fishers oppose the project",
          "The site is impossible for schools to visit"
        ],
        answer: 1,
        explanation:
          "Paragraph 4 says 'Two hectares is tiny compared with the historic loss' and that restoration cannot replace protecting existing beds."
      },
      {
        question: "What does the final sentence suggest about the project?",
        options: [
          "It is mainly designed to attract media attention",
          "Its value lies partly in encouraging long-term care for an unseen landscape",
          "It will produce measurable results within a single year",
          "It is too slow to be worth continuing"
        ],
        answer: 1,
        explanation:
          "The final paragraph contrasts slow, invisible work with headlines and says it asks people to care for benefits measured in decades."
      }
    ]
  },
  {
    slug: "draft-beneath",
    level: "7-8",
    style: "editorial",
    topic: "Language & technology",
    title: "The Draft Beneath the Draft",
    subtitle:
      "If a machine can write in our style, what exactly are we protecting when we insist on writing ourselves?",
    minutes: 8,
    paragraphs: [
      "The first time a language model completed my sentence, I felt a small, undignified thrill. The suggestion was not merely grammatical; it was plausible. It had absorbed the cadence of my argument and returned something that sounded, briefly, like the next thought I might have had. The second time, the thrill had cooled into a more complicated question: if the sentence was already latent in the system, what was I doing when I wrote it?",
      "The obvious answer is that writing communicates. But anyone who has written seriously knows that this is only half the transaction. Writing is also how a vague intuition becomes a claim. The difficulty of finding the right verb is not an obstacle to thinking; it is thinking. Fluency can be borrowed, but the friction that produces an idea cannot. A language model is, among other things, an extraordinarily efficient way of removing friction.",
      "This is why the familiar distinction between the writer and the tool can feel unstable. A pen does not suggest what to write; a search engine answers only what is asked. A generative model participates. It offers continuations before the user has articulated a destination, and its participation is shaped by a vast, opaque corpus of other people's words. The result may be competent, even distinctive, while the process remains strangely anonymous. Whose draft is it if every sentence was individually approved?",
      "Defenders of the technology point out, reasonably, that all writing is collaborative. We inherit genres, phrases and arguments; editors improve our sentences; dictionaries standardise our choices. The difference is one of degree, perhaps, but degree can become kind. There is a distinction between using a tradition and outsourcing the moment of judgement. The former gives the writer a language to work within; the latter offers the comfort of not having to arrive at one.",
      "This distinction matters most in education, where the purpose of an essay is not the essay. It is the formation of a mind capable of noticing its own errors. To hand a student a polished paragraph is to hand them the result and remove the experience. The same is true, less obviously, of professional writing. A memo still needs a mind behind it, someone willing to say: this is what I believe, and this is why.",
      "None of this requires a romantic belief in solitary genius. It requires only a willingness to distinguish between assistance and substitution. A writer might use a model to generate alternatives, to test an argument, to produce a first map of unfamiliar territory. What they cannot delegate without consequence is the judgement of what belongs. The draft beneath the draft \u2014 provisional, uncertain, occasionally embarrassing \u2014 is not waste material. It is the place where authorship is made."
    ],
    glossary: [
      {
        word: "latent",
        phonetic: "/\u02c8le\u026atnt/",
        pos: "adjective",
        definition: "present but not yet active, developed or visible",
        example: "The skills were latent until the project gave her a chance to use them."
      },
      {
        word: "cadence",
        phonetic: "/\u02c8ke\u026adns/",
        pos: "noun",
        definition: "the rhythm or flow of a sequence of sounds or words",
        example: "The cadence of her prose made even a dull subject memorable."
      },
      {
        word: "friction",
        phonetic: "/\u02c8fr\u026ak\u0283n/",
        pos: "noun",
        definition: "resistance or difficulty that slows a process",
        example: "Some friction in a creative process can be productive."
      },
      {
        word: "opaque",
        phonetic: "/\u0259\u028a\u02c8pe\u026ak/",
        pos: "adjective",
        definition: "difficult to understand; not transparent",
        example: "The decision-making process remained opaque to outsiders."
      },
      {
        word: "outsource",
        phonetic: "/\u02c8a\u028ats\u0254\u02d0s/",
        pos: "verb",
        definition: "to arrange for work to be done by another person or organisation",
        example: "The company outsourced its customer service to a separate firm."
      },
      {
        word: "provisional",
        phonetic: "/pr\u0259\u02c8v\u026a\u0292\u0259nl/",
        pos: "adjective",
        definition: "temporary and likely to be changed",
        example: "We made a provisional plan, subject to the final budget."
      },
      {
        word: "substitution",
        phonetic: "/\u02ccs\u028cbst\u026a\u02c8tju\u02d0\u0283n/",
        pos: "noun",
        definition: "the act of replacing one thing with another",
        example: "The substitution of cheaper materials weakened the structure."
      },
      {
        word: "judgement",
        phonetic: "/\u02c8d\u0292\u028cd\u0292m\u0259nt/",
        pos: "noun",
        definition: "the ability to make considered decisions or form sensible opinions",
        example: "Editing requires judgement as much as technical skill."
      }
    ],
    questions: [
      {
        question: "What is the author's central concern about generative writing tools?",
        options: [
          "They produce too many grammatical errors",
          "They remove the productive difficulty through which ideas are formed",
          "They are too expensive for most students",
          "They cannot imitate an individual's style"
        ],
        answer: 1,
        explanation:
          "The author argues that friction is part of thinking and that a model removing friction can outsource judgement itself."
      },
      {
        question: "Why does the author describe the distinction between writing and tools as 'unstable'?",
        options: [
          "Because pens are no longer used for writing",
          "Because generative tools suggest continuations before the writer knows their destination",
          "Because dictionaries change their definitions",
          "Because all writing has become collaborative"
        ],
        answer: 1,
        explanation:
          "Unlike a pen or a search engine, a generative model actively participates by offering possible directions before the user has formed an intention."
      },
      {
        question: "What is the author's attitude towards the argument that all writing is collaborative?",
        options: [
          "Fully accepting it without qualification",
          "Rejecting it as entirely false",
          "Acknowledging it while insisting that a difference in degree can become a difference in kind",
          "Treating it as irrelevant to education"
        ],
        answer: 2,
        explanation:
          "Paragraph 4 says the point is 'reasonable' before distinguishing using a tradition from outsourcing judgement."
      },
      {
        question: "Which statement best expresses the final paragraph's view of the writer's uncertain early draft?",
        options: [
          "It should be deleted once a polished version exists",
          "It is inefficient and can be skipped with good tools",
          "It is the essential material from which authorship is formed",
          "It matters only in academic writing"
        ],
        answer: 2,
        explanation:
          "The final paragraph calls the provisional, uncertain draft 'not waste material' but the place where authorship is made."
      }
    ]
  },
  {
    slug: "ice-memory",
    level: "7-8",
    style: "news",
    topic: "Science & climate",
    title: "What the Ice Remembers",
    subtitle:
      "In a freezer in Tasmania, scientists are reading a library written in snow \u2014 one air bubble at a time.",
    minutes: 8,
    paragraphs: [
      "The core is no thicker than a human arm and cold enough to burn bare skin. Wrapped in insulated tubes, it lies in a freezer that hums with quiet persistence. Each segment is a vertical record of snowfall stretching back thousands of years. Trapped inside the ice are tiny bubbles of atmosphere, sealed when the snow was compressed into glacier. To a climate scientist, they are letters from the past.",
      "Ice cores are among the most precise archives of ancient climate available. As snow accumulates, it captures dust, ash, volcanic chemicals and the isotopic composition of the water itself. Because each year leaves a distinguishable layer, researchers can build a chronology extending tens of thousands of years. The air bubbles provide something rarer still: direct samples of the gases that surrounded our ancestors, rather than a proxy inferred from rock or pollen.",
      "The logistics are formidable. Drilling teams work in remote regions where equipment must be flown in and storms can pin crews down for days. The cores must be kept below about \u221220\u00b0C throughout their journey, then carefully divided between laboratories. Different teams analyse different properties, often from adjacent slices, and the results must be reconciled. \u201cA core is not a single record,\u201d says glaciologist Dr Miriam Kaur. \u201cIt is a series of overlapping records that must agree with one another.\u201d",
      "That process of reconciliation is where much of the scientific value lies. An unusually warm interval recorded in one core can be compared with evidence from another glacier, a coral reef or a tree-ring series. Agreement strengthens the case; disagreement becomes a question. In this way, the ice does not simply report the past. It tests the stories scientists tell about it.",
      "The archive is also finite. Many glaciers are retreating, and low-latitude ice fields that once preserved detailed records are disappearing. Some researchers now prioritise \u201cice rescue\u201d \u2014 drilling and storing samples before they melt. A repository in Antarctica preserves cores for future scientists who may have better instruments and different questions. It is an unusual kind of optimism: setting aside evidence for a generation that does not yet exist.",
      "The freezer in Tasmania is not a monument. It is a working library, opened and re-read as methods improve. Its value lies partly in its silence: no headline, no dramatic image, only a column of ancient ice and the slow, cumulative work of knowing. What the ice remembers is not a message addressed to us. It is a record we have learned, imperfectly, to read."
    ],
    glossary: [
      {
        word: "archive",
        phonetic: "/\u02c8\u0251\u02d0ka\u026av/",
        pos: "noun",
        definition: "a collection of historical records or materials kept for the future",
        example: "The library's photographic archive dates back to 1890."
      },
      {
        word: "isotopic",
        phonetic: "/\u02cca\u026as\u0259\u02c8t\u0252p\u026ak/",
        pos: "adjective",
        definition: "relating to atomic variants of an element that differ in mass",
        example: "The isotopic signature of the ice reveals past temperatures."
      },
      {
        word: "proxy",
        phonetic: "/\u02c8pr\u0252ksi/",
        pos: "noun",
        definition: "something used as an indirect measure of another thing",
        example: "Tree rings are a proxy for historical rainfall."
      },
      {
        word: "formidable",
        phonetic: "/\u02c8f\u0254\u02d0m\u026ad\u0259bl/",
        pos: "adjective",
        definition: "inspiring fear or respect through size, difficulty or power",
        example: "The team faced a formidable logistical challenge."
      },
      {
        word: "reconcile",
        phonetic: "/\u02c8rek\u0259nsa\u026al/",
        pos: "verb",
        definition: "to make two apparently conflicting things consistent",
        example: "Researchers tried to reconcile the two sets of measurements."
      },
      {
        word: "retreating",
        phonetic: "/r\u026a\u02c8tri\u02d0t\u026a\u014b/",
        pos: "adjective",
        definition: "moving back or becoming smaller",
        example: "Retreating glaciers are changing the landscape."
      },
      {
        word: "cumulative",
        phonetic: "/\u02c8kju\u02d0mj\u0259l\u0259t\u026av/",
        pos: "adjective",
        definition: "increasing gradually by successive additions",
        example: "The cumulative effect of small savings can be substantial."
      },
      {
        word: "imperfectly",
        phonetic: "/\u026am\u02c8p\u025c\u02d0f\u026aktli/",
        pos: "adverb",
        definition: "in a way that has faults or limits",
        example: "We understand the system imperfectly but well enough to predict it."
      }
    ],
    questions: [
      {
        question: "Why are air bubbles in ice cores especially valuable to researchers?",
        options: [
          "They contain living organisms from the past",
          "They offer direct samples of ancient atmosphere rather than an indirect proxy",
          "They reveal exactly how old the ice is",
          "They are easier to extract than other evidence"
        ],
        answer: 1,
        explanation:
          "The passage says the bubbles give 'direct samples of the gases' instead of a proxy inferred from other evidence."
      },
      {
        question: "What does Dr Kaur's comment suggest about ice core research?",
        options: [
          "A single core provides a complete and final record",
          "Different analyses must be cross-checked to establish confidence",
          "Ice cores are less reliable than other climate records",
          "Only one laboratory should analyse each core"
        ],
        answer: 1,
        explanation:
          "She describes a core as overlapping records that must agree, and the next paragraph explains reconciliation."
      },
      {
        question: "Why does the author call the Antarctic repository 'an unusual kind of optimism'?",
        options: [
          "It is intended to attract tourists in the future",
          "It preserves samples for scientists whose questions and tools do not yet exist",
          "It proves that glaciers will stop melting",
          "It relies on cold weather to keep operating"
        ],
        answer: 1,
        explanation:
          "The repository stores cores for future scientists who may have better instruments and different questions, an optimism directed at a generation not yet present."
      },
      {
        question: "What is the effect of the final sentence's phrase 'a record we have learned, imperfectly, to read'?",
        options: [
          "It suggests the ice contains deliberate messages for humanity",
          "It emphasises both scientific progress and the limits of our understanding",
          "It argues that ice core research should be abandoned",
          "It implies that all past climate records are false"
        ],
        answer: 1,
        explanation:
          "The phrase acknowledges that scientists have developed the ability to interpret the ice while admitting that their reading remains imperfect."
      }
    ]
  }
];

const STYLE_ALIASES = {
  news: "news",
  "academic article": "academic article",
  academic: "academic article",
  story: "story",
  editorial: "editorial"
};

const READING_LEVELS = ["5-6", "6-7", "7-8"];

function readingForLevel(level) {
  return READING_BANK.filter((item) => item.level === level);
}

function normalizeReadingBankItem(item) {
  const paragraphs = Array.isArray(item.paragraphs)
    ? item.paragraphs.map((p) => String(p).trim()).filter(Boolean)
    : [];
  const wordCount = paragraphs.join(" ").trim().split(/\s+/).filter(Boolean).length;
  return {
    slug: item.slug,
    level: READING_LEVELS.includes(item.level) ? item.level : "6-7",
    style: item.style || "editorial",
    topic: item.topic || "Everyday life",
    title: String(item.title || "Untitled passage").slice(0, 160),
    subtitle: String(item.subtitle || "").slice(0, 300),
    minutes: Number(item.minutes) || Math.max(3, Math.round(wordCount / 170)),
    paragraphs,
    wordCount,
    glossary: Array.isArray(item.glossary) ? item.glossary.slice(0, 10) : [],
    questions: Array.isArray(item.questions) ? item.questions.slice(0, 5) : []
  };
}

/** Deterministic "daily" choice so every learner at a level shares the edition. */
function dailyReading(level, dayKey) {
  const bank = readingForLevel(level);
  const seed = Number(String(dayKey).replace(/-/g, "")) + READING_LEVELS.indexOf(level) * 7;
  const chosen = bank[seed % bank.length] || bank[0] || READING_BANK[0];
  return normalizeReadingBankItem({ ...chosen, minutes: chosen.minutes });
}

function fallbackReading({ level = "6-7", style, topic } = {}) {
  const matches = readingForLevel(level);
  let chosen = matches[0];
  if (style) {
    const wanted = STYLE_ALIASES[String(style).toLowerCase()] || style;
    chosen = matches.find((p) => p.style === wanted) || chosen;
  }
  if (topic) {
    const topicMatches = matches.filter((p) =>
      `${p.topic} ${p.title}`.toLowerCase().includes(String(topic).toLowerCase())
    );
    if (topicMatches.length) chosen = topicMatches[0];
  }
  return normalizeReadingBankItem(chosen);
}

function readingPreview(passage) {
  const storedContent = (() => {
    if (passage.content) return passage.content;
    if (passage.content_json) {
      try {
        return JSON.parse(passage.content_json);
      } catch {
        return {};
      }
    }
    return {};
  })();
  const paragraphs = storedContent.paragraphs || passage.paragraphs || [];
  return {
    id: passage.id || null,
    title: storedContent.title || passage.title,
    subtitle: storedContent.subtitle || passage.subtitle || "",
    level: passage.level,
    style: storedContent.style || passage.style || "",
    topic: storedContent.topic || passage.topic || "",
    minutes: storedContent.minutes || passage.minutes || 5,
    wordCount: storedContent.wordCount || Number(passage.word_count) || 0,
    source: passage.source || "studio",
    createdAt: passage.created_at || null,
    excerpt: paragraphs[0] ? paragraphs[0].slice(0, 175) + "…" : ""
  };
}

const WRITING_PROMPTS = [
  {
    id: "t2-service",
    task: 2,
    category: "Education",
    title: "Service and schooling",
    prompt:
      "Some people believe that unpaid community service should be a compulsory part of high school education. To what extent do you agree or disagree?",
    tip: "Take a clear position and support it with specific examples. Acknowledge one counterargument."
  },
  {
    id: "t2-living-alone",
    task: 2,
    category: "Society",
    title: "The rise of solo living",
    prompt:
      "In many countries, a growing number of people are choosing to live alone. Why is this happening, and what effects does it have on society?",
    tip: "This is a two-part question: give both causes and effects, with a clear link between them."
  },
  {
    id: "t2-technology-meaning",
    task: 2,
    category: "Technology",
    title: "Convenience and meaning",
    prompt:
      "Some people argue that technology has made our lives more convenient but less meaningful. Discuss both views and give your own opinion.",
    tip: "Discuss both sides before stating a nuanced position. Avoid listing examples without analysis."
  },
  {
    id: "t2-transport",
    task: 2,
    category: "Cities",
    title: "Moving people",
    prompt:
      "Governments should spend more money on public transport than on building new roads. To what extent do you agree or disagree?",
    tip: "Consider costs, capacity, rural access and the environment. Your position can be conditional."
  },
  {
    id: "t2-careers",
    task: 2,
    category: "Work",
    title: "The changing career",
    prompt:
      "Many young people now change jobs frequently rather than staying with one employer. Is this a positive or negative development?",
    tip: "Evaluate, don't just describe. Ask what 'positive' means — for individuals, employers and society."
  },
  {
    id: "t2-environment",
    task: 2,
    category: "Environment",
    title: "Who protects the planet?",
    prompt:
      "The best way to protect the environment is to make individuals responsible rather than governments. To what extent do you agree?",
    tip: "A strong answer considers scale, enforcement and the limits of individual action."
  },
  {
    id: "t2-university",
    task: 2,
    category: "Education",
    title: "Skills and scholarship",
    prompt:
      "Some people think universities should focus on practical skills for employment, while others believe academic knowledge is more important. Discuss both views and give your own opinion.",
    tip: "Define what each side values, then show how the two purposes can overlap."
  },
  {
    id: "t2-advertising",
    task: 2,
    category: "Media",
    title: "The manufactured want",
    prompt:
      "Advertising encourages people to buy things they do not really need. To what extent do you agree or disagree?",
    tip: "Distinguish between needs and wants, and consider whether advertising is persuasive or merely informative."
  },
  {
    id: "t1-internet",
    task: 1,
    category: "Technology",
    title: "Household internet access",
    prompt:
      "The bar chart shows the percentage of households with internet access in four countries in 2005 and 2015. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    tip: "Open with a clear overview of the biggest change. Use precise numbers sparingly.",
    chart: {
      type: "bar",
      unit: "%",
      yLabel: "Households with internet access",
      categories: ["Canada", "Japan", "Brazil", "India"],
      series: [
        { name: "2005", values: [52, 38, 12, 3] },
        { name: "2015", values: [86, 78, 48, 18] }
      ]
    }
  },
  {
    id: "t1-leisure",
    task: 1,
    category: "Lifestyle",
    title: "How leisure time changed",
    prompt:
      "The line graph shows the average number of hours per week spent on three leisure activities in the UK between 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    tip: "Group trends that move in the same direction. Highlight the crossover point if there is one.",
    chart: {
      type: "line",
      unit: "hours/week",
      yLabel: "Average weekly hours",
      categories: ["2000", "2005", "2010", "2015", "2020"],
      series: [
        { name: "Watching TV", values: [18, 17, 15, 14, 11] },
        { name: "Online media", values: [4, 7, 11, 15, 19] },
        { name: "Reading", values: [6, 6, 5, 4, 4] }
      ]
    }
  },
  {
    id: "t1-energy",
    task: 1,
    category: "Environment",
    title: "The changing energy mix",
    prompt:
      "The chart shows the share of electricity generated from different sources in one country in 2010 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    tip: "Report the largest sources and the most significant changes. Keep speculation out of Task 1.",
    chart: {
      type: "bar",
      unit: "%",
      yLabel: "Share of electricity",
      categories: ["Coal", "Gas", "Wind", "Solar", "Other"],
      series: [
        { name: "2010", values: [42, 30, 12, 1, 15] },
        { name: "2022", values: [18, 26, 28, 13, 15] }
      ]
    }
  }
];

function writingPromptForTask(task) {
  const bank = WRITING_PROMPTS.filter((p) => Number(p.task) === Number(task));
  return bank[Math.floor(Math.random() * bank.length)];
}

function writingPromptById(id) {
  return WRITING_PROMPTS.find((p) => p.id === id);
}

const WRITING_TASK2_PROMPTS = WRITING_PROMPTS.filter((p) => p.task === 2);

const SPEAKING_PROMPTS = [
  {
    id: "sp-place",
    mode: "passage",
    category: "Places",
    title: "A place that shaped you",
    prompt:
      "Describe a place that has shaped the person you are today. You should say where it is, how often you went there, what you did there, and explain why it mattered to you.",
    cue: "Aim for a story, not a list. Choose two or three specific details that reveal why the place mattered.",
    seconds: 120
  },
  {
    id: "sp-skill",
    mode: "passage",
    category: "Learning",
    title: "A skill you would learn",
    prompt:
      "Describe a skill you would like to learn, even if it is difficult. You should say what the skill is, how you would learn it, what might make it challenging, and why you want to learn it.",
    cue: "Use concrete language. Explain what progress would look and feel like.",
    seconds: 120
  },
  {
    id: "sp-conversation",
    mode: "paragraph",
    category: "Communication",
    title: "The conversations that stay",
    prompt:
      "Do you think people remember conversations more than they remember information? Why might that be?",
    cue: "State a position, give a reason, and support it with an example from your own experience.",
    seconds: 75
  },
  {
    id: "sp-cities",
    mode: "paragraph",
    category: "Cities",
    title: "The future of city centres",
    prompt:
      "Some people believe city centres should become car-free. Would that improve city life? What would need to change to make it work?",
    cue: "A balanced answer can agree with the idea while naming a condition or trade-off.",
    seconds: 90
  },
  {
    id: "sp-technology",
    mode: "passage",
    category: "Technology",
    title: "A technology you rely on",
    prompt:
      "Describe a technology you rely on in everyday life. You should say what it is, when you started using it, how it helps you, and whether it has any disadvantages for you.",
    cue: "Avoid generic praise. Show how the technology has changed a specific habit.",
    seconds: 120
  },
  {
    id: "sp-teacher",
    mode: "paragraph",
    category: "Learning",
    title: "What makes a good teacher",
    prompt:
      "What qualities do you think make a good teacher, and how have those qualities changed in the digital age?",
    cue: "Compare the past with the present in one or two sentences, then focus on your main idea.",
    seconds: 90
  },
  {
    id: "sp-routine",
    mode: "passage",
    category: "Everyday life",
    title: "A habit you changed",
    prompt:
      "Describe a habit you changed and how it affected your life. You should say what the habit was, why you changed it, how difficult the change was, and how you feel about it now.",
    cue: "Use past tenses for the change and present tenses for the result. Tell it as a small story.",
    seconds: 120
  },
  {
    id: "sp-reading",
    mode: "paragraph",
    category: "Culture",
    title: "Reading in a distracted world",
    prompt:
      "Do you think people read differently today compared with twenty years ago? What are the effects of that change?",
    cue: "Use one concrete contrast to ground your answer. Avoid a list of generalisations.",
    seconds: 90
  }
];

function speakingPromptForMode(mode) {
  const bank = SPEAKING_PROMPTS.filter((p) => p.mode === mode);
  return bank[Math.floor(Math.random() * bank.length)];
}

const LISTENING_SAMPLES = [
  {
    slug: "soil",
    level: "6-7",
    topic: "Science & nature",
    accent: "British",
    title: "The Secret Life of Soil",
    intro: "A short science talk about the ecosystem beneath our feet.",
    script:
      "When we think about biodiversity, we usually picture rainforests or coral reefs. But one of the richest habitats on Earth is directly beneath our shoes. A single teaspoon of healthy soil can contain more living organisms than there are people on the planet. Most of them are invisible: bacteria, fungi, tiny worms and single-celled creatures. Together, they form a food web that breaks down dead material, stores water and makes nutrients available to plants. Fungal networks are particularly important. Their threads can extend for metres, connecting roots and helping trees share water and minerals. Farmers are now trying to protect this underground ecosystem. Cover crops keep soil covered between harvests, while reduced ploughing avoids breaking up fungal networks. These methods can improve soil health over time, although they may not immediately produce higher yields. Researchers say the lesson is simple: healthy soil is not empty space. It is infrastructure, and it is alive.",
    questions: [
      {
        question: "What comparison does the speaker make about a teaspoon of healthy soil?",
        options: [
          "It contains more organisms than the number of people on Earth",
          "It holds more water than a small lake",
          "It contains fewer species than a coral reef",
          "It weighs more than a teaspoon of sand"
        ],
        answer: 0,
        explanation:
          "The speaker says a single teaspoon can contain more living organisms than there are people on the planet."
      },
      {
        question: "Why are fungal networks important?",
        options: [
          "They kill harmful bacteria in the soil",
          "They connect roots and help plants share water and minerals",
          "They make soil dry and easy to plough",
          "They replace the need for cover crops"
        ],
        answer: 1,
        explanation:
          "Fungal threads extend for metres and connect roots, helping trees share water and minerals."
      },
      {
        question: "Which method of protecting soil is mentioned?",
        options: [
          "Ploughing more deeply",
          "Removing all crop cover",
          "Planting cover crops between harvests",
          "Adding artificial fertiliser every week"
        ],
        answer: 2,
        explanation:
          "Cover crops keep soil covered between harvests; reduced ploughing is also mentioned."
      },
      {
        question: "What qualification does the speaker make about these farming methods?",
        options: [
          "They always produce higher yields in the first year",
          "They improve soil health but may not raise yields immediately",
          "They are too expensive for any farm",
          "They only work in tropical countries"
        ],
        answer: 1,
        explanation:
          "The talk says the methods can improve soil health, 'although they may not immediately produce higher yields'."
      }
    ]
  },
  {
    slug: "fifteen-minute",
    level: "7-8",
    topic: "Cities & society",
    accent: "British",
    title: "The Fifteen-Minute City",
    intro: "A city-planning talk about closeness, choice and a controversial idea.",
    script:
      "The idea of the fifteen-minute city sounds almost too simple: everyone should be able to reach the essentials of daily life within a quarter of an hour, ideally on foot or by bicycle. Schools, shops, healthcare, parks and workplaces, all within reach. The concept was popularised by the French-Colombian scientist Carlos Moreno and has been adopted, at least rhetorically, by mayors from Paris to Melbourne. Its appeal is easy to understand. Shorter journeys mean less traffic, cleaner air and more time. They can also strengthen local economies, because people who walk to a neighbourhood shop are more likely to know its owner. But critics point out that the concept can hide difficult trade-offs. Not everyone can choose where they live. Nurses, delivery drivers and cleaners often work across a city and may not find affordable housing near their jobs. A neighbourhood that is pleasant for pedestrians can also become expensive, pushing out the very residents it was meant to serve. And for some, the car is not a luxury but a necessity. The strongest versions of the fifteen-minute city therefore focus less on drawing circles on a map and more on public investment: frequency of transport, distribution of housing and the quality of local services. Proximity is a useful goal. Access is the real one.",
    questions: [
      {
        question: "What is the central aim of the fifteen-minute city?",
        options: [
          "To make every city journey exactly fifteen minutes long",
          "To make daily essentials reachable within a short walk or cycle",
          "To remove all cars from city centres",
          "To encourage people to work from home permanently"
        ],
        answer: 1,
        explanation:
          "The idea is that essentials should be reachable within a quarter of an hour, ideally on foot or by bicycle."
      },
      {
        question: "According to the speaker, what is one possible benefit of the idea?",
        options: [
          "It reduces the need for affordable housing",
          "It can strengthen local economies",
          "It guarantees shorter working hours",
          "It eliminates the need for public transport"
        ],
        answer: 1,
        explanation:
          "People who walk to local shops are more likely to know the owner, which can support local economies."
      },
      {
        question: "Which criticism of the concept is mentioned?",
        options: [
          "It is opposed by every city mayor",
          "It ignores the fact that not everyone can choose where to live",
          "It requires all residents to sell their cars",
          "It has only been tried in France"
        ],
        answer: 1,
        explanation:
          "The talk notes that nurses, delivery drivers and cleaners may work across a city and cannot necessarily live near their jobs."
      },
      {
        question: "What does the speaker identify as the 'real' goal?",
        options: [
          "Proximity on a map",
          "Access to opportunities and services",
          "Making all neighbourhoods identical",
          "Increasing property values"
        ],
        answer: 1,
        explanation:
          "The final line says: 'Proximity is a useful goal. Access is the real one.'"
      }
    ]
  },
  {
    slug: "study-habits",
    level: "5-6",
    topic: "Campus life",
    accent: "American",
    title: "A Better Way to Study",
    intro: "A student adviser shares three practical habits for revision.",
    script:
      "Many students believe that studying longer is the same as studying better. It is not. Your brain needs time to process what you have learned, so short, regular sessions are often more effective than one long night before an exam. The first habit is to decide what you will study before you open your notes. Write one clear question at the top of the page, such as: how does photosynthesis work? Then close the textbook and try to answer it from memory. This is called retrieval practice, and it helps you discover what you actually know. The second habit is to space your revision across several days. If you have five hours, do not spend them all on Sunday. Spread them over the week, even in sessions of twenty minutes. The third habit is to test yourself with questions rather than simply rereading. Reading feels comfortable, but comfortable is not the same as learning. Finally, take real breaks. Ten minutes away from your desk can improve the next twenty minutes of work. Your goal is not to sit at the desk for the longest time. It is to remember more when you leave it.",
    questions: [
      {
        question: "What is the speaker's main point about study time?",
        options: [
          "Longer sessions are always better",
          "Short, regular sessions are often more effective",
          "Students should study only at weekends",
          "Everyone needs exactly five hours per week"
        ],
        answer: 1,
        explanation:
          "The talk says short, regular sessions are often more effective than one long night before an exam."
      },
      {
        question: "What is retrieval practice?",
        options: [
          "Rereading notes until they feel familiar",
          "Trying to answer a question from memory",
          "Reading a textbook with a friend",
          "Writing notes in a different colour"
        ],
        answer: 1,
        explanation:
          "The speaker describes closing the textbook and trying to answer a question from memory."
      },
      {
        question: "How does the speaker recommend spreading five hours of revision?",
        options: [
          "All on Sunday evening",
          "Across the week in shorter sessions",
          "Only before the exam",
          "Two hours on one day and three the next"
        ],
        answer: 1,
        explanation:
          "The advice is to spread the time over the week, even in twenty-minute sessions."
      },
      {
        question: "Why does the speaker suggest taking breaks?",
        options: [
          "To avoid doing any difficult work",
          "Because ten minutes away can improve the next period of work",
          "Because memory only works during breaks",
          "To finish homework for another subject"
        ],
        answer: 1,
        explanation:
          "Ten minutes away from the desk can improve the next twenty minutes of work."
      }
    ]
  }
];

function listeningForLevel(level) {
  return LISTENING_SAMPLES.find((l) => l.level === level) || LISTENING_SAMPLES[0];
}

function listeningBySlug(slug) {
  return LISTENING_SAMPLES.find((l) => l.slug === slug);
}

const DICTIONARY_SEED = (() => {
  const map = new Map();
  for (const passage of READING_BANK) {
    for (const entry of passage.glossary || []) {
      const key = entry.word.toLowerCase();
      if (!map.has(key)) map.set(key, entry);
    }
  }
  return map;
})();

const WORD_OF_DAY_POOL = [
  { word: "notice", phonetic: "/\u02c8n\u0259\u028at\u026as/", pos: "verb", definition: "to become aware of something through careful attention", example: "The best readers notice what a writer leaves unsaid." },
  { word: "tenderness", phonetic: "/\u02c8tend\u0259n\u0259s/", pos: "noun", definition: "gentle care and kindness towards someone or something", example: "She spoke about her old school with unexpected tenderness." },
  { word: "patient", phonetic: "/\u02c8pe\u026a\u0283nt/", pos: "adjective", definition: "able to wait or deal with difficulty without becoming annoyed", example: "Learning a language is easier when you are patient with yourself." },
  { word: "clear", phonetic: "/kl\u026a\u0259/", pos: "adjective", definition: "easy to understand, hear or see", example: "A clear argument is usually a kind one." },
  { word: "curious", phonetic: "/\u02c8kj\u028a\u0259ri\u0259s/", pos: "adjective", definition: "eager to know or learn something", example: "Curious people ask better questions." },
  { word: "horizon", phonetic: "/h\u0259\u02c8ra\u026azn/", pos: "noun", definition: "the line where the sky appears to meet the land or sea; the limit of current knowledge or experience", example: "Travel widened her horizon." },
  { word: "deliberate", phonetic: "/d\u026a\u02c8l\u026ab\u0259r\u0259t/", pos: "adjective", definition: "intentional; done with careful thought", example: "His silence was deliberate, not shy." },
  { word: "resilient", phonetic: "/r\u026a\u02c8z\u026ali\u0259nt/", pos: "adjective", definition: "able to recover quickly from difficulty", example: "A resilient learner treats a mistake as information." }
];

function wordOfTheDay(dayKey) {
  const seed = Number(String(dayKey).replace(/-/g, ""));
  return WORD_OF_DAY_POOL[seed % WORD_OF_DAY_POOL.length];
}

const GRAMMAR_TOPICS = [
  {
    slug: "present-perfect", title: "Present perfect vs past simple", category: "Verbs & tenses", level: "5-6", minutes: 8,
    blurb: "Say what happened — and what is still connected to now.",
    sections: [
      { heading: "The time line is the clue", body: "Use the past simple for a finished action at a finished time: I visited Lisbon in 2022. Use the present perfect when the time is not specified, or when the result still matters now: I have visited Lisbon, so I know the city. Words like yesterday, last year and in 2019 usually signal the past simple. Words like already, ever, never, just and since often point to the present perfect.", examples: [{ wrong: "I have seen that film yesterday.", good: "I saw that film yesterday." }, { wrong: "She has finished her degree in 2020.", good: "She finished her degree in 2020." }] },
      { heading: "Ask a different question", body: "The choice changes what you are asking. Did you eat? asks about a specific earlier event. Have you eaten? asks whether you are hungry now. In British English, the present perfect is common with unfinished time periods: I have worked here for three years. In American English, the past simple is also often used here.", examples: [{ wrong: "I have lost my keys last night, so I am late.", good: "I lost my keys last night, so I am late." }, { wrong: "I am working here since 2021.", good: "I have worked here since 2021." }] }
    ],
    tip: "If you can name the finished time, choose the past simple. If the connection to now is the point, choose the present perfect.",
    quiz: [
      { question: "When ___ your first teaching job?", options: ["have you started", "did you start", "are you starting", "had you start"], answer: 1, explanation: "A finished time is implied, and 'when' asks for a specific past moment. Use the past simple." },
      { question: "I ___ this book three times, and I notice something new each time.", options: ["read", "have read", "was reading", "had read"], answer: 1, explanation: "The experience up to now matters, not the specific occasion. The present perfect fits." },
      { question: "Marta ___ to Japan in 2019.", options: ["has gone", "has been", "went", "has visited"], answer: 2, explanation: "A completed year (2019) is a finished time, so use the past simple." },
      { question: "We ___ here since the shop opened.", options: ["are living", "lived", "have lived", "were living"], answer: 2, explanation: "The period began in the past and continues to now; use the present perfect with 'since'." }
    ]
  },
  {
    slug: "articles", title: "Articles: a, an, the, zero", category: "Words & phrases", level: "5-6", minutes: 8,
    blurb: "Help your reader know which one you mean.",
    sections: [
      { heading: "First mention, then the", body: "Use a or an when you introduce a singular countable noun that your reader does not yet know: I bought a book. Use the when both of you know which thing you mean: the book was expensive. After the first mention, switch to the. If the noun is plural or uncountable and you mean something in general, use no article: Books are expensive. Water is essential.", examples: [{ wrong: "I have a cat and a dog. The cat is calm, but dog is noisy.", good: "I have a cat and a dog. The cat is calm, but the dog is noisy." }, { wrong: "The honesty is important in a relationship.", good: "Honesty is important in a relationship." }] },
      { heading: "The small words that carry meaning", body: "Use an before a vowel sound: an hour, an MA, an honest answer. Use a before a consonant sound: a university, a European city. The is also used with superlatives, unique things and many geographical names: the best option, the sun, the Pacific. We say the internet but usually no article for abstract ideas when speaking generally: Education changes lives.", examples: [{ wrong: "She is best student in class.", good: "She is the best student in the class." }, { wrong: "I need an university degree.", good: "I need a university degree." }] }
    ],
    tip: "Ask yourself: have I introduced this thing yet, and do you and I mean the same one? Those two questions resolve most article choices.",
    quiz: [
      { question: "She is ___ honest researcher and ___ best in her field.", options: ["a / the", "an / the", "the / a", "an / a"], answer: 1, explanation: "'Honest' begins with a vowel sound, so use 'an'. 'Best' takes 'the' as a superlative." },
      { question: "I bought ___ umbrella yesterday. ___ umbrella is already broken.", options: ["an / The", "the / An", "an / An", "a / The"], answer: 0, explanation: "First mention uses 'an'; after both people know which umbrella, use 'the'." },
      { question: "___ education is one of ___ most powerful tools for change.", options: ["The / the", "An / the", "No article / the", "No article / no article"], answer: 2, explanation: "Education in general is uncountable, so no article; 'most powerful' is superlative and takes 'the'." },
      { question: "He studied at ___ European university for ___ year.", options: ["a / a", "an / a", "the / an", "a / an"], answer: 0, explanation: "'European' begins with a consonant sound (/j\u028a/), and 'year' also begins with a consonant sound, so both take 'a'." }
    ]
  },
  {
    slug: "conditionals", title: "Conditionals, clearly", category: "Sentence building", level: "6-7", minutes: 9,
    blurb: "Move from facts to imagined futures, regrets and past consequences.",
    sections: [
      { heading: "Four useful patterns", body: "Zero conditional describes general truths: If you heat ice, it melts. First conditional describes a real future possibility: If it rains, we will move indoors. Second conditional imagines an unreal present or unlikely future: If I had more time, I would read more. Third conditional looks back at an imagined past: If we had left earlier, we would have caught the train.", examples: [{ wrong: "If I will see her, I will tell her.", good: "If I see her, I will tell her." }, { wrong: "If I would have known, I would have come.", good: "If I had known, I would have come." }] },
      { heading: "Mixed conditionals and small adjustments", body: "Mixed conditionals connect different times: If I had studied medicine, I would be a doctor now. The if-clause refers to the past; the result to the present. Formal English can invert: Had I known, I would have acted sooner. Unless means if not. Even if means the result is true regardless of the condition.", examples: [{ wrong: "Unless you do not hurry, we will be late.", good: "Unless you hurry, we will be late." }, { wrong: "I would have called you if I would have your number.", good: "I would have called you if I had your number." }] }
    ],
    tip: "Look at the time being imagined, not the tense label. If it is a real future possibility, keep will out of the if-clause.",
    quiz: [
      { question: "If I ___ more free time, I would learn the piano.", options: ["have", "had", "would have", "will have"], answer: 1, explanation: "This imagines an unreal present situation, so use the second conditional: if + past simple, would + verb." },
      { question: "If you heat water to 100°C, it ___.", options: ["boils", "will boil", "would boil", "boiled"], answer: 0, explanation: "A general truth uses the zero conditional: if + present simple, present simple." },
      { question: "We would have arrived on time if the bus ___ late.", options: ["was not", "had not been", "would not be", "has not been"], answer: 1, explanation: "This is an imagined past, so use the third conditional: would have + past participle, if + had + past participle." },
      { question: "___ I known about the traffic, I would have taken the train.", options: ["If", "Had", "Have", "Should"], answer: 1, explanation: "Inverted third conditional: 'Had I known' = 'If I had known'." }
    ]
  },
  {
    slug: "prepositions-time", title: "Prepositions of time", category: "Words & phrases", level: "5-6", minutes: 6,
    blurb: "In, on and at are small — but their logic is surprisingly regular.",
    sections: [
      { heading: "From large to small", body: "Use in for longer periods: months, years, seasons, centuries, parts of the day. Use on with days and dates. Use at with clock times, specific moments and a few fixed phrases. Think of it as zooming in: in 2024, in June, in the morning; on Tuesday, on 14 May; at 7 p.m., at noon, at night.", examples: [{ wrong: "I will meet you in Monday.", good: "I will meet you on Monday." }, { wrong: "The class starts on 9 o'clock.", good: "The class starts at 9 o'clock." }] },
      { heading: "Boundaries and durations", body: "Use by for a deadline: finish it by Friday. Use until for a continuous period ending at a time: I worked until Friday. Use for with a length of time and since with a starting point: I studied for three hours; I have lived here since 2018. In and within differ: within two weeks means before the period ends.", examples: [{ wrong: "I have worked here for 2019.", good: "I have worked here since 2019." }, { wrong: "Please finish until Friday.", good: "Please finish by Friday." }] }
    ],
    tip: "For a deadline choose by; for duration choose for; for a starting point choose since.",
    quiz: [
      { question: "The workshop begins ___ 10 a.m. ___ Friday.", options: ["in / on", "at / on", "on / at", "at / in"], answer: 1, explanation: "Clock times take 'at'; days take 'on'." },
      { question: "I have known her ___ 2017.", options: ["for", "since", "from", "during"], answer: 1, explanation: "'2017' is a starting point, so use 'since'." },
      { question: "Please send the report ___ Friday at the latest.", options: ["until", "by", "since", "in"], answer: 1, explanation: "'By' marks a deadline. 'Until' would mean continuously up to Friday." },
      { question: "The streets are quiet ___ night.", options: ["in", "on", "at", "by"], answer: 2, explanation: "The fixed phrase is 'at night'. We also say 'in the morning' and 'in the afternoon'." }
    ]
  },
  {
    slug: "passive-voice", title: "The passive voice", category: "Sentence building", level: "6-7", minutes: 8,
    blurb: "Shift the focus — and decide what your reader needs to know.",
    sections: [
      { heading: "Focus on the action, not the actor", body: "The passive is formed with be + past participle. Use it when the actor is unknown, unimportant or obvious, or when you want to focus on the result: The bridge was built in 1890. The results were checked by an independent team. The object of an active sentence becomes the subject of the passive: The council approved the plan → The plan was approved by the council.", examples: [{ wrong: "The new library was built from the city last year.", good: "The new library was built by the city last year." }, { wrong: "The report is wrote by the manager.", good: "The report was written by the manager." }] },
      { heading: "Don't hide responsibility", body: "The passive can be useful, but it can also obscure who did something: Mistakes were made. In academic writing, this is sometimes appropriate. In persuasive or journalistic writing, naming the actor can add clarity and accountability. Avoid mixing tenses: The bridge was built in 1890 and is used daily is fine; The bridge was built in 1890 and is using daily is not.", examples: [{ wrong: "The data were analysed and was found to be reliable.", good: "The data were analysed and were found to be reliable." }, { wrong: "A decision was been made.", good: "A decision has been made." }] }
    ],
    tip: "Before using the passive, ask: does my reader need to know who acted? If yes, write an active sentence instead.",
    quiz: [
      { question: "The novel ___ by a local author in 1998.", options: ["published", "was published", "has publishing", "is publish"], answer: 1, explanation: "A finished past action with a clear object: singular 'novel' takes 'was published'." },
      { question: "Which sentence is passive?", options: ["The team completed the survey.", "The survey was completed by the team.", "The team is completing a survey.", "The survey team completed it."], answer: 1, explanation: "The passive uses be + past participle and the former object as subject." },
      { question: "The tests ___ at the moment.", options: ["are being marked", "are marking", "have mark", "is been marked"], answer: 0, explanation: "Present continuous passive: are being + past participle." },
      { question: "Mistakes ___.", options: ["were made", "was made", "made", "have make"], answer: 0, explanation: "'Mistakes' is plural, so use 'were made'. This passive is grammatical — though naming who made them may be clearer." }
    ]
  },
  {
    slug: "relative-clauses", title: "Relative clauses", category: "Sentence building", level: "6-7", minutes: 8,
    blurb: "Add detail without starting a new sentence — and know when to drop the pronoun.",
    sections: [
      { heading: "Defining and non-defining", body: "A defining relative clause identifies which person or thing you mean: The book that she recommended was excellent. No commas are needed. A non-defining clause simply adds extra information, and is separated by commas: My sister, who lives in Osaka, is visiting. Use who for people, which for things, and whose for possession. Where refers to places.", examples: [{ wrong: "The scientist which discovered the vaccine won a prize.", good: "The scientist who discovered the vaccine won a prize." }, { wrong: "My brother who lives in Osaka is visiting.", good: "My brother, who lives in Osaka, is visiting." }] },
      { heading: "That, which and leaving things out", body: "In defining clauses, that can often replace who or which: the book that she recommended. You can omit the relative pronoun when it is the object of the clause: The book (that) I bought was expensive. You cannot omit it when it is the subject: The woman who called is outside — not 'The woman called is outside' unless the meaning changes. In non-defining clauses, use who or which, not that.", examples: [{ wrong: "The house that I grew up in it is gone.", good: "The house that I grew up in is gone." }, { wrong: "My mother, that is a teacher, loves history.", good: "My mother, who is a teacher, loves history." }] }
    ],
    tip: "Commas change the meaning. My sister who lives in Osaka implies you have more than one sister; My sister, who lives in Osaka, adds a detail about your only sister.",
    quiz: [
      { question: "The architect ___ designed this building won an award.", options: ["which", "who", "whose", "where"], answer: 1, explanation: "The architect is a person, so use 'who'." },
      { question: "This is the café ___ we first met.", options: ["which", "who", "where", "whose"], answer: 2, explanation: "The clause refers to a place and is complete without a missing object, so use 'where'." },
      { question: "Which sentence correctly omits a relative pronoun?", options: ["The film I watched was excellent.", "The film watched was excellent.", "The actor I met him was tired.", "The café we ate there was small."], answer: 0, explanation: "The relative pronoun can be omitted when it is the object: the film (that) I watched." },
      { question: "My laptop, ___ I bought last year, is already slow.", options: ["that", "who", "which", "where"], answer: 2, explanation: "This is a non-defining clause about a thing; use 'which', not 'that', after a comma." }
    ]
  },
  {
    slug: "modals", title: "Modals for speculation", category: "Verbs & tenses", level: "7-8", minutes: 9,
    blurb: "Say how certain you are without promising more than you know.",
    sections: [
      { heading: "Degrees of certainty", body: "Use must when you are almost certain based on evidence: She must be tired — she has been awake since dawn. Use might, may or could for possibility: He might have missed the bus. Use can't when you are certain something is impossible: That can't be true. In the past, use modal + have + past participle: They must have left early. The modal does not change for tense or person: she must, not she musts.", examples: [{ wrong: "He might has forgotten the meeting.", good: "He might have forgotten the meeting." }, { wrong: "She musts be exhausted.", good: "She must be exhausted." }] },
      { heading: "Sounding appropriately cautious", body: "Academic and professional English often needs careful degrees of certainty. Compare: This proves the theory is correct (very strong) with This suggests the theory may be correct (appropriately cautious). Use should when you expect something but are not certain: The parcel should arrive tomorrow. Use would for imagined situations: The trip would have been easier with a map.", examples: [{ wrong: "The data must be wrong because I do not understand it.", good: "The data may contain an error, or my analysis may be incomplete." }, { wrong: "If she would have known, she would have called.", good: "If she had known, she would have called." }] }
    ],
    tip: "Match the modal to your evidence. Strong claims need strong evidence — not just confidence.",
    quiz: [
      { question: "The lights are on, so someone ___ be home.", options: ["can", "must", "might", "should"], answer: 1, explanation: "The evidence strongly supports a conclusion, so 'must' expresses near certainty." },
      { question: "She isn't answering. She ___ have left her phone at home.", options: ["must", "can", "might", "should"], answer: 2, explanation: "This is one possible explanation, not a certainty, so 'might have' is appropriate." },
      { question: "That ___ be the right address — I checked it twice.", options: ["can't", "must", "shouldn't", "might"], answer: 0, explanation: "The speaker is certain it is not wrong, based on checking twice; 'can't' expresses impossibility." },
      { question: "Which sentence is most appropriately cautious?", options: ["The results prove that the policy is a complete success.", "The results suggest that the policy may be effective.", "The results must mean the policy is perfect.", "The results can't be wrong."], answer: 1, explanation: "Cautious academic language uses 'suggest' and 'may' rather than absolute claims." }
    ]
  },
  {
    slug: "gerunds-infinitives", title: "Gerunds and infinitives", category: "Verbs & tenses", level: "6-7", minutes: 9,
    blurb: "Why we enjoy reading but want to read — and when both work.",
    sections: [
      { heading: "Verbs that choose for you", body: "Some verbs are followed by a gerund (-ing): enjoy, avoid, suggest, mind, practise, look forward to. Others are followed by an infinitive: want, decide, hope, plan, manage, afford. A few take either with little change: begin, start, continue. A few change meaning: remember doing (a memory) vs remember to do (a task); stop doing (end a habit) vs stop to do (pause in order to do something).", examples: [{ wrong: "I enjoy to read before bed.", good: "I enjoy reading before bed." }, { wrong: "We decided going home.", good: "We decided to go home." }] },
      { heading: "Prepositions and purpose", body: "After a preposition, the verb takes -ing: interested in learning, good at explaining, instead of waiting, look forward to meeting. The infinitive often expresses purpose: I went out to buy milk. After make and let, use the bare infinitive: She made me laugh; let me try. After adjectives, use the infinitive: It is difficult to concentrate.", examples: [{ wrong: "I look forward to meet you.", good: "I look forward to meeting you." }, { wrong: "She made me to apologise.", good: "She made me apologise." }] }
    ],
    tip: "Learn the pattern with the verb, not separately. 'Enjoy + -ing' and 'want + to' are worth memorising as whole frames.",
    quiz: [
      { question: "She suggested ___ a break.", options: ["take", "taking", "to take", "took"], answer: 1, explanation: "'Suggest' is followed by a gerund: suggest doing something." },
      { question: "I look forward to ___ from you.", options: ["hear", "hearing", "heard", "to hear"], answer: 1, explanation: "'To' here is a preposition (look forward to), so the following verb takes -ing." },
      { question: "We stopped ___ some water before continuing.", options: ["drinking", "to drink", "drink", "drank"], answer: 1, explanation: "Stop to do means pause in order to do something. 'Stop drinking water' would mean ending the habit." },
      { question: "She made me ___ the whole story again.", options: ["tell", "to tell", "telling", "told"], answer: 0, explanation: "After 'make' + object, use the bare infinitive: make someone do something." }
    ]
  },
  {
    slug: "comparatives", title: "Comparatives and superlatives", category: "Words & phrases", level: "5-6", minutes: 7,
    blurb: "Compare two things, or place one at the top of a group.",
    sections: [
      { heading: "More, most and -er", body: "Short adjectives take -er and -est: warm, warmer, warmest. Longer adjectives use more and most: useful, more useful, most useful. Never use both: more warmer is incorrect. Irregular forms include good/better/best, bad/worse/worst, and far/further/furthest. Use than after a comparative: The new library is larger than the old one.", examples: [{ wrong: "This is more easier than I expected.", good: "This is easier than I expected." }, { wrong: "She is the most tallest in the class.", good: "She is the tallest in the class." }] },
      { heading: "Avoiding the obvious comparison", body: "Comparative forms should compare like with like: The weather in Lisbon is warmer than in London, not warmer than London. Use as ... as for equality and not as ... as for inequality. Use the more ... the more for linked changes: The more you practise, the more confident you become. For a small difference, use slightly, a little and a bit.", examples: [{ wrong: "The traffic is worse than last year's traffic in terms of delay time.", good: "Delays this year are worse than last year." }, { wrong: "It is more cheaper to travel by bus.", good: "It is cheaper to travel by bus." }] }
    ],
    tip: "Check two things: never double the comparative, and always compare comparable things.",
    quiz: [
      { question: "This test was ___ than the last one.", options: ["more hard", "harder", "hardest", "most hard"], answer: 1, explanation: "Hard is a short adjective, so the comparative is 'harder'. Never 'more harder'." },
      { question: "She is ___ person I know.", options: ["the more patient", "the most patient", "more patient", "most patient"], answer: 1, explanation: "Comparing within a whole group calls for the superlative, and long adjectives take 'the most'." },
      { question: "The ___ you read, the ___ your vocabulary becomes.", options: ["more / richer", "most / richest", "much / rich", "more / rich"], answer: 0, explanation: "The 'the more ..., the more ...' pattern links two changes; both need comparatives." },
      { question: "Is Tokyo ___ than Bangkok?", options: ["more expensive", "most expensive", "expensiver", "the more expensive"], answer: 0, explanation: "Use the comparative after 'than'; long adjectives take 'more'." }
    ]
  },
  {
    slug: "subject-verb-agreement", title: "Subject–verb agreement", category: "Sentence building", level: "5-6", minutes: 7,
    blurb: "Keep the verb faithful to the real subject.",
    sections: [
      { heading: "Find the real subject", body: "The verb agrees with the subject, not with a noun next to it. In The list of applicants is long, the subject is list, so the verb is is. Watch out for phrases between the subject and verb: The number of cars has increased; A number of cars have been removed. A number of = several (plural); the number = one figure (singular).", examples: [{ wrong: "The quality of the schools have improved.", good: "The quality of the schools has improved." }, { wrong: "A number of people is waiting.", good: "A number of people are waiting." }] },
      { heading: "Special subjects", body: "Subjects joined by and usually take a plural verb, but a single idea may be singular: Research and development is important. Each, every, either and neither are singular: Each student has a desk. Collective nouns like team, government and audience can be singular when acting as one unit: The team is winning. Words like news, data and police vary in usage; use a consistent style and be prepared for data to take a singular or plural verb depending on convention.", examples: [{ wrong: "Every applicants has a ticket.", good: "Every applicant has a ticket." }, { wrong: "The team are each doing their own thing.", good: "The team are each doing their own thing. (If acting as individuals, plural can be correct.)" }] }
    ],
    tip: "Cross out the phrase between the subject and verb. Then ask which noun the verb really belongs to.",
    quiz: [
      { question: "The collection of paintings ___ displayed in the east wing.", options: ["are", "is", "were", "have been"], answer: 1, explanation: "The subject is 'collection' (singular), not 'paintings'." },
      { question: "A number of students ___ volunteered for the study.", options: ["has", "is", "have", "was"], answer: 2, explanation: "'A number of' means several and takes a plural verb." },
      { question: "Each of the proposals ___ its own budget.", options: ["have", "need", "has", "are having"], answer: 2, explanation: "'Each' is singular, so use 'has'." },
      { question: "The government ___ announced a new policy, acting as one body.", options: ["have", "has", "are", "were"], answer: 1, explanation: "As a single unit, a collective noun like government commonly takes a singular verb." }
    ]
  }
];

const GRAMMAR_TOPIC_SUMMARIES = GRAMMAR_TOPICS.map(({ slug, title, category, level, minutes, blurb }) => ({
  slug,
  title,
  category,
  level,
  minutes,
  blurb,
  questionCount: GRAMMAR_TOPICS.find((t) => t.slug === slug).quiz.length
}));

function grammarTopic(slug) {
  return GRAMMAR_TOPICS.find((t) => t.slug === slug) || null;
}

module.exports = {
  READING_BANK,
  READING_LEVELS,
  dailyReading,
  fallbackReading,
  normalizeReadingBankItem,
  readingForLevel,
  readingPreview,
  STYLE_ALIASES,
  WRITING_PROMPTS,
  WRITING_TASK2_PROMPTS,
  writingPromptForTask,
  writingPromptById,
  SPEAKING_PROMPTS,
  speakingPromptForMode,
  LISTENING_SAMPLES,
  listeningForLevel,
  listeningBySlug,
  DICTIONARY_SEED,
  WORD_OF_DAY_POOL,
  wordOfTheDay,
  GRAMMAR_TOPICS,
  GRAMMAR_TOPIC_SUMMARIES,
  grammarTopic
};

