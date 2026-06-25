-- Run this in Cloudflare D1 → your database → Console tab
-- If you need to reset: DROP TABLE words; DROP TABLE stages; then run again.

CREATE TABLE IF NOT EXISTS stages (
  stage   INTEGER PRIMARY KEY,
  label   TEXT NOT NULL,
  letters TEXT NOT NULL   -- cumulative, in introduction order
);

CREATE TABLE IF NOT EXISTS words (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  word      TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',  -- filename only, e.g. sat.jpg
  stage     INTEGER NOT NULL           -- stage at which this word becomes spellable
);

-- ─── Stages ───────────────────────────────────────────────
-- Letters are cumulative and in introduction order.
-- Edit these to match your school's exact phonics sequence.
INSERT INTO stages VALUES (1,  'SATPIN',   's,a,t,p,i,n');
INSERT INTO stages VALUES (2,  '+ M',      's,a,t,p,i,n,m');
INSERT INTO stages VALUES (3,  '+ D',      's,a,t,p,i,n,m,d');
INSERT INTO stages VALUES (4,  '+ G',      's,a,t,p,i,n,m,d,g');
INSERT INTO stages VALUES (5,  '+ O',      's,a,t,p,i,n,m,d,g,o');
INSERT INTO stages VALUES (6,  '+ C',      's,a,t,p,i,n,m,d,g,o,c');
INSERT INTO stages VALUES (7,  '+ K',      's,a,t,p,i,n,m,d,g,o,c,k');
INSERT INTO stages VALUES (8,  '+ E',      's,a,t,p,i,n,m,d,g,o,c,k,e');
INSERT INTO stages VALUES (9,  '+ U',      's,a,t,p,i,n,m,d,g,o,c,k,e,u');
INSERT INTO stages VALUES (10, '+ R',      's,a,t,p,i,n,m,d,g,o,c,k,e,u,r');
INSERT INTO stages VALUES (11, '+ H',      's,a,t,p,i,n,m,d,g,o,c,k,e,u,r,h');
INSERT INTO stages VALUES (12, '+ B',      's,a,t,p,i,n,m,d,g,o,c,k,e,u,r,h,b');
INSERT INTO stages VALUES (13, '+ F',      's,a,t,p,i,n,m,d,g,o,c,k,e,u,r,h,b,f');
INSERT INTO stages VALUES (14, '+ L',      's,a,t,p,i,n,m,d,g,o,c,k,e,u,r,h,b,f,l');

-- ─── Words ────────────────────────────────────────────────
-- image_url = filename in your R2 bucket (e.g. sat.jpg).
-- Leave blank ('') if you haven't uploaded the image yet — the app shows a placeholder.
-- Add or remove words freely. The stage number means "all letters of this word
-- are first available at this stage."

-- Stage 1: SATPIN
INSERT INTO words (word, image_url, stage) VALUES ('sat',  'sat.jpg',  1);
INSERT INTO words (word, image_url, stage) VALUES ('sit',  'sit.jpg',  1);
INSERT INTO words (word, image_url, stage) VALUES ('sip',  'sip.jpg',  1);
INSERT INTO words (word, image_url, stage) VALUES ('tin',  'tin.jpg',  1);
INSERT INTO words (word, image_url, stage) VALUES ('tip',  'tip.jpg',  1);
INSERT INTO words (word, image_url, stage) VALUES ('tap',  'tap.jpg',  1);
INSERT INTO words (word, image_url, stage) VALUES ('tan',  'tan.jpg',  1);
INSERT INTO words (word, image_url, stage) VALUES ('nap',  'nap.jpg',  1);
INSERT INTO words (word, image_url, stage) VALUES ('nit',  'nit.jpg',  1);
INSERT INTO words (word, image_url, stage) VALUES ('pin',  'pin.jpg',  1);
INSERT INTO words (word, image_url, stage) VALUES ('pit',  'pit.jpg',  1);
INSERT INTO words (word, image_url, stage) VALUES ('pat',  'pat.jpg',  1);
INSERT INTO words (word, image_url, stage) VALUES ('pan',  'pan.jpg',  1);
INSERT INTO words (word, image_url, stage) VALUES ('ant',  'ant.jpg',  1);

-- Stage 2: + M
INSERT INTO words (word, image_url, stage) VALUES ('man',  'man.jpg',  2);
INSERT INTO words (word, image_url, stage) VALUES ('mat',  'mat.jpg',  2);
INSERT INTO words (word, image_url, stage) VALUES ('map',  'map.jpg',  2);
INSERT INTO words (word, image_url, stage) VALUES ('aim',  'aim.jpg',  2);
INSERT INTO words (word, image_url, stage) VALUES ('imp',  'imp.jpg',  2);
INSERT INTO words (word, image_url, stage) VALUES ('mast', 'mast.jpg', 2);

-- Stage 3: + D
INSERT INTO words (word, image_url, stage) VALUES ('din',  'din.jpg',  3);
INSERT INTO words (word, image_url, stage) VALUES ('dip',  'dip.jpg',  3);
INSERT INTO words (word, image_url, stage) VALUES ('dim',  'dim.jpg',  3);
INSERT INTO words (word, image_url, stage) VALUES ('dam',  'dam.jpg',  3);
INSERT INTO words (word, image_url, stage) VALUES ('dad',  'dad.jpg',  3);
INSERT INTO words (word, image_url, stage) VALUES ('did',  'did.jpg',  3);
INSERT INTO words (word, image_url, stage) VALUES ('mad',  'mad.jpg',  3);
INSERT INTO words (word, image_url, stage) VALUES ('sad',  'sad.jpg',  3);

-- Stage 4: + G
INSERT INTO words (word, image_url, stage) VALUES ('gap',  'gap.jpg',  4);
INSERT INTO words (word, image_url, stage) VALUES ('gas',  'gas.jpg',  4);
INSERT INTO words (word, image_url, stage) VALUES ('dig',  'dig.jpg',  4);
INSERT INTO words (word, image_url, stage) VALUES ('pig',  'pig.jpg',  4);
INSERT INTO words (word, image_url, stage) VALUES ('nag',  'nag.jpg',  4);
INSERT INTO words (word, image_url, stage) VALUES ('tag',  'tag.jpg',  4);
INSERT INTO words (word, image_url, stage) VALUES ('gig',  'gig.jpg',  4);
INSERT INTO words (word, image_url, stage) VALUES ('big',  'big.jpg',  4);

-- Stage 5: + O
INSERT INTO words (word, image_url, stage) VALUES ('top',  'top.jpg',  5);
INSERT INTO words (word, image_url, stage) VALUES ('dog',  'dog.jpg',  5);
INSERT INTO words (word, image_url, stage) VALUES ('pot',  'pot.jpg',  5);
INSERT INTO words (word, image_url, stage) VALUES ('mop',  'mop.jpg',  5);
INSERT INTO words (word, image_url, stage) VALUES ('nod',  'nod.jpg',  5);
INSERT INTO words (word, image_url, stage) VALUES ('dot',  'dot.jpg',  5);
INSERT INTO words (word, image_url, stage) VALUES ('got',  'got.jpg',  5);
INSERT INTO words (word, image_url, stage) VALUES ('ton',  'ton.jpg',  5);
INSERT INTO words (word, image_url, stage) VALUES ('pod',  'pod.jpg',  5);

-- Stage 6: + C
INSERT INTO words (word, image_url, stage) VALUES ('can',  'can.jpg',  6);
INSERT INTO words (word, image_url, stage) VALUES ('cap',  'cap.jpg',  6);
INSERT INTO words (word, image_url, stage) VALUES ('cat',  'cat.jpg',  6);
INSERT INTO words (word, image_url, stage) VALUES ('cot',  'cot.jpg',  6);
INSERT INTO words (word, image_url, stage) VALUES ('cod',  'cod.jpg',  6);
INSERT INTO words (word, image_url, stage) VALUES ('cop',  'cop.jpg',  6);
INSERT INTO words (word, image_url, stage) VALUES ('cog',  'cog.jpg',  6);
INSERT INTO words (word, image_url, stage) VALUES ('cos',  'cos.jpg',  6);

-- Stage 7: + K
INSERT INTO words (word, image_url, stage) VALUES ('kit',  'kit.jpg',  7);
INSERT INTO words (word, image_url, stage) VALUES ('kid',  'kid.jpg',  7);
INSERT INTO words (word, image_url, stage) VALUES ('kip',  'kip.jpg',  7);
INSERT INTO words (word, image_url, stage) VALUES ('ski',  'ski.jpg',  7);
INSERT INTO words (word, image_url, stage) VALUES ('ink',  'ink.jpg',  7);
INSERT INTO words (word, image_url, stage) VALUES ('ask',  'ask.jpg',  7);
INSERT INTO words (word, image_url, stage) VALUES ('oak',  'oak.jpg',  7);

-- Stage 8: + E
INSERT INTO words (word, image_url, stage) VALUES ('net',  'net.jpg',  8);
INSERT INTO words (word, image_url, stage) VALUES ('set',  'set.jpg',  8);
INSERT INTO words (word, image_url, stage) VALUES ('pet',  'pet.jpg',  8);
INSERT INTO words (word, image_url, stage) VALUES ('ten',  'ten.jpg',  8);
INSERT INTO words (word, image_url, stage) VALUES ('den',  'den.jpg',  8);
INSERT INTO words (word, image_url, stage) VALUES ('pen',  'pen.jpg',  8);
INSERT INTO words (word, image_url, stage) VALUES ('peg',  'peg.jpg',  8);
INSERT INTO words (word, image_url, stage) VALUES ('keg',  'keg.jpg',  8);
INSERT INTO words (word, image_url, stage) VALUES ('gem',  'gem.jpg',  8);
INSERT INTO words (word, image_url, stage) VALUES ('get',  'get.jpg',  8);

-- Stage 9: + U
INSERT INTO words (word, image_url, stage) VALUES ('sun',  'sun.jpg',  9);
INSERT INTO words (word, image_url, stage) VALUES ('cup',  'cup.jpg',  9);
INSERT INTO words (word, image_url, stage) VALUES ('cut',  'cut.jpg',  9);
INSERT INTO words (word, image_url, stage) VALUES ('mud',  'mud.jpg',  9);
INSERT INTO words (word, image_url, stage) VALUES ('mug',  'mug.jpg',  9);
INSERT INTO words (word, image_url, stage) VALUES ('nut',  'nut.jpg',  9);
INSERT INTO words (word, image_url, stage) VALUES ('pun',  'pun.jpg',  9);
INSERT INTO words (word, image_url, stage) VALUES ('tug',  'tug.jpg',  9);
INSERT INTO words (word, image_url, stage) VALUES ('dug',  'dug.jpg',  9);
INSERT INTO words (word, image_url, stage) VALUES ('gun',  'gun.jpg',  9);
INSERT INTO words (word, image_url, stage) VALUES ('sum',  'sum.jpg',  9);
INSERT INTO words (word, image_url, stage) VALUES ('gum',  'gum.jpg',  9);

-- Stage 10: + R
INSERT INTO words (word, image_url, stage) VALUES ('run',  'run.jpg',  10);
INSERT INTO words (word, image_url, stage) VALUES ('rat',  'rat.jpg',  10);
INSERT INTO words (word, image_url, stage) VALUES ('ram',  'ram.jpg',  10);
INSERT INTO words (word, image_url, stage) VALUES ('rip',  'rip.jpg',  10);
INSERT INTO words (word, image_url, stage) VALUES ('rod',  'rod.jpg',  10);
INSERT INTO words (word, image_url, stage) VALUES ('rot',  'rot.jpg',  10);
INSERT INTO words (word, image_url, stage) VALUES ('rug',  'rug.jpg',  10);
INSERT INTO words (word, image_url, stage) VALUES ('rim',  'rim.jpg',  10);
INSERT INTO words (word, image_url, stage) VALUES ('car',  'car.jpg',  10);
INSERT INTO words (word, image_url, stage) VALUES ('tar',  'tar.jpg',  10);

-- Stage 11: + H
INSERT INTO words (word, image_url, stage) VALUES ('hen',  'hen.jpg',  11);
INSERT INTO words (word, image_url, stage) VALUES ('hat',  'hat.jpg',  11);
INSERT INTO words (word, image_url, stage) VALUES ('hit',  'hit.jpg',  11);
INSERT INTO words (word, image_url, stage) VALUES ('hop',  'hop.jpg',  11);
INSERT INTO words (word, image_url, stage) VALUES ('hot',  'hot.jpg',  11);
INSERT INTO words (word, image_url, stage) VALUES ('hug',  'hug.jpg',  11);
INSERT INTO words (word, image_url, stage) VALUES ('hum',  'hum.jpg',  11);
INSERT INTO words (word, image_url, stage) VALUES ('her',  'her.jpg',  11);
INSERT INTO words (word, image_url, stage) VALUES ('hog',  'hog.jpg',  11);

-- Stage 12: + B
INSERT INTO words (word, image_url, stage) VALUES ('bat',  'bat.jpg',  12);
INSERT INTO words (word, image_url, stage) VALUES ('bed',  'bed.jpg',  12);
INSERT INTO words (word, image_url, stage) VALUES ('big',  'big.jpg',  12);
INSERT INTO words (word, image_url, stage) VALUES ('bin',  'bin.jpg',  12);
INSERT INTO words (word, image_url, stage) VALUES ('bus',  'bus.jpg',  12);
INSERT INTO words (word, image_url, stage) VALUES ('bud',  'bud.jpg',  12);
INSERT INTO words (word, image_url, stage) VALUES ('bug',  'bug.jpg',  12);
INSERT INTO words (word, image_url, stage) VALUES ('bun',  'bun.jpg',  12);
INSERT INTO words (word, image_url, stage) VALUES ('rib',  'rib.jpg',  12);
INSERT INTO words (word, image_url, stage) VALUES ('rub',  'rub.jpg',  12);
INSERT INTO words (word, image_url, stage) VALUES ('tub',  'tub.jpg',  12);
INSERT INTO words (word, image_url, stage) VALUES ('sob',  'sob.jpg',  12);

-- Stage 13: + F
INSERT INTO words (word, image_url, stage) VALUES ('fan',  'fan.jpg',  13);
INSERT INTO words (word, image_url, stage) VALUES ('fat',  'fat.jpg',  13);
INSERT INTO words (word, image_url, stage) VALUES ('fit',  'fit.jpg',  13);
INSERT INTO words (word, image_url, stage) VALUES ('fog',  'fog.jpg',  13);
INSERT INTO words (word, image_url, stage) VALUES ('fun',  'fun.jpg',  13);
INSERT INTO words (word, image_url, stage) VALUES ('fin',  'fin.jpg',  13);
INSERT INTO words (word, image_url, stage) VALUES ('fur',  'fur.jpg',  13);
INSERT INTO words (word, image_url, stage) VALUES ('fir',  'fir.jpg',  13);

-- Stage 14: + L
INSERT INTO words (word, image_url, stage) VALUES ('leg',  'leg.jpg',  14);
INSERT INTO words (word, image_url, stage) VALUES ('lip',  'lip.jpg',  14);
INSERT INTO words (word, image_url, stage) VALUES ('log',  'log.jpg',  14);
INSERT INTO words (word, image_url, stage) VALUES ('lot',  'lot.jpg',  14);
INSERT INTO words (word, image_url, stage) VALUES ('lid',  'lid.jpg',  14);
INSERT INTO words (word, image_url, stage) VALUES ('lob',  'lob.jpg',  14);
INSERT INTO words (word, image_url, stage) VALUES ('lad',  'lad.jpg',  14);
INSERT INTO words (word, image_url, stage) VALUES ('lap',  'lap.jpg',  14);
INSERT INTO words (word, image_url, stage) VALUES ('lug',  'lug.jpg',  14);
INSERT INTO words (word, image_url, stage) VALUES ('nil',  'nil.jpg',  14);
INSERT INTO words (word, image_url, stage) VALUES ('elf',  'elf.jpg',  14);
