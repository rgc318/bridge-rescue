(() => {
  'use strict';
  const PI = Math.PI, UP = -PI / 2;
  const world = Object.freeze({width:400, height:470, ground:320, leftEdge:96, rightEdge:305});
  const plank = (id, x, y, length, angle, anchor = 0, width = 13) =>
    ({id,kind:'plank',x,y,length,angle,anchor,width,opacity:1});
  const pin = (id, x, y, label, holds, kind, order) =>
    ({id,x,y,label,holds,kind,order,removed:false,pull:0});
  const bird = (id, x) => ({id,x,y:300,baseY:300,hop:0,opacity:1,direction:1,rescued:false});
  const levels = [
    {
      id:'first-crossing', title:'第一座桥', subtitle:'让桥落下，别让它掉进河里。',
      hint:'上面的销钉锁住桥板，下面的销钉是桥的转轴。',
      solution:['upper'],
      parts:[plank('bridge',92,320,224,UP,0,15)],
      pins:[
        pin('upper',92,174,'上方锁销','bridge','latch',1),
        pin('hinge',92,320,'底部转轴销','bridge','hinge',2)
      ],
      birds:[bird('sparrow',51)],
      winText:'桥搭好了，小鸟安全过河！',
    },
    {
      id:'short-support', title:'差一点够到', subtitle:'一块桥板太短，找到另一段桥。',
      hint:'看看对岸。先放下那段短桥，再落下长桥。',
      solution:['support','long'],
      parts:[plank('bridge',92,320,178,UP,0,15),plank('extension',309,320,46,UP,0,13)],
      pins:[
        pin('long',92,191,'长桥锁销','bridge','latch',1),
        pin('support',309,281,'短桥锁销','extension','latch',2)
      ],
      birds:[bird('sparrow',51)],
      winText:'两段桥接在一起，小鸟过去了！',
    },
    {
      id:'seesaw', title:'天平上的桥', subtitle:'让跷跷桥保持水平，救出两只小鸟。',
      hint:'重物在桥的高端上方。放下重物，别抽走桥的转轴。',
      solution:['weight'],
      parts:[
        plank('bridge',209,320,234,-.29,.5,15),
        {id:'counterweight',kind:'counterweight',x:277,y:145,width:35,height:32,length:0,angle:0,anchor:.5,opacity:1}
      ],
      pins:[
        pin('weight',277,119,'配重锁销','counterweight','latch',1),
        pin('pivot',209,320,'跷跷桥转轴销','bridge','hinge',2)
      ],
      birds:[bird('sparrow',42),bird('chick',68)],
      winText:'桥面放平了，两只小鸟都获救！',
    },
    {
      id:'two-wings', title:'双翼吊桥', subtitle:'两块桥板都需要在河中央找到支撑。',
      hint:'先让配重把桥墩升起来。两边的桥板谁先放下都行。',
      par:3, solution:['lift','left','right'],
      parts:[
        plank('leftWing',92,320,118,UP,0,15),plank('rightWing',309,320,119,UP,0,15),
        plank('pier',201,422,95,UP,.5,19),
        {id:'hoistWeight',kind:'counterweight',x:264,y:178,width:35,height:32,length:0,angle:0,anchor:.5,opacity:1}
      ],
      pins:[
        pin('lift',264,152,'桥墩配重销','hoistWeight','latch',1),
        pin('left',92,228,'左翼锁销','leftWing','latch',2),
        pin('right',309,244,'右翼锁销','rightWing','latch',3)
      ],
      birds:[bird('sparrow',41),bird('chick',67)],
      winText:'左右桥板都搭稳了，两只山雀安全过河！',
    },
    {
      id:'feather-catching', title:'接住金羽毛', subtitle:'可以直接过桥，也可以先布好接羽毛的托盘。',
      hint:'想拿到羽毛：先放下右侧的小托盘，再放掉羽毛下的挡板，最后放桥。',
      par:1, bonusPar:3, bonus:1, solution:['deck'], bonusSolution:['tray','feather','deck'],
      feathers:[{id:'gold',x:185,y:243,collected:false,lost:false,opacity:1}],
      parts:[
        plank('bridge',92,320,222,UP,0,15),plank('featherLatch',231,257,84,-PI,0,10),
        plank('tray',228,327,63,UP,0,11)
      ],
      pins:[
        pin('deck',92,193,'过河桥锁销','bridge','latch',1),
        pin('tray',228,308,'接羽毛的托盘销','tray','latch',2),
        pin('feather',179,257,'羽毛挡板销','featherLatch','latch',3)
      ],
      birds:[bird('sparrow',49)],
      winText:'山雀安全飞回了营地！',
    },
    {
      id:'double-route', title:'上下两条路', subtitle:'用备用托架快速搭桥，或升桥墩顺路取回羽毛。',
      hint:'下方托架能直接托起短桥。想收羽毛：先放配重，再落上方短桥。',
      par:2, bonusPar:3, bonus:1, solution:['brace','deck'], bonusSolution:['lift','short','deck'],
      feathers:[{id:'gold',x:263,y:225,collected:false,lost:false,opacity:1}],
      parts:[
        plank('bridge',92,320,148,UP,0,15),plank('short',310,320,77,UP,0,15),
        plank('brace',305,333,76,1.86,0,12),plank('pier',249,410,87,UP,.5,18),
        {id:'weight',kind:'counterweight',x:266,y:187,width:35,height:32,length:0,angle:0,anchor:.5,opacity:1}
      ],
      pins:[
        pin('deck',92,216,'主桥锁销','bridge','latch',1),
        pin('short',310,261,'上方短桥销','short','latch',2),
        pin('lift',266,160,'升墩配重销','weight','latch',3),
        pin('brace',289,388,'下方备用托架销','brace','latch',4)
      ],
      birds:[bird('sparrow',41),bird('chick',67)],
      winText:'终于过河了，两只山雀都安全了！',
    },
  ];
  // In chapters 2 and 3, pins form small mechanism graphs. A pin can uncover
  // another pin's landing spot, and two routes can solve the same goal.
  const beam=(id,x,y,l,a=UP,role='wood',anchor=0,w=14)=>({...plank(id,x,y,l,a,anchor,w),role});
  const stone=(id,x,y,role='weight')=>({id,kind:'counterweight',role,x,y,width:35,height:32,length:0,angle:0,anchor:.5,opacity:1});
  const ftr=(id,x,y)=>({id,x,y,collected:false,lost:false,opacity:1});
  const latch=(id,x,y,label,holds,kind='latch')=>pin(id,x,y,label,holds,kind,0);
  const rope=(from,to,opts={})=>({from,to,...opts});
  const act=(id,message,ops=[],options={})=>({id,message,ops,...options});
  // Ops: settle a falling leaf, move one body, or send a feather to its catch.
  const leaf=(id,angle=0,x,y)=>({kind:'leaf',id,angle,x,y});
  const go=(id,props,seconds=.46,curve='ease')=>({kind:'move',id,props,seconds,curve});
  const drop=(id,y)=>go(id,{y,angle:.08},.52,'gravity');
  const feather=(id,x,y)=>({kind:'feather',id,x,y});
  const releaseFeather=(id,shelf,restingOn,x,y)=>({kind:'releaseFeather',id,shelf,restingOn,x,y});
  const loseFeather=(id,x,y)=>({kind:'featherLost',id,x,y});
  const snap=(message,id,angle=.97,x,y)=>({message,ops:[{kind:'fail',id,angle,x,y}]});
  const WINGL=0, WINGR=-PI;
  const wing=(id)=>leaf(id,id==='right'?WINGR:WINGL);
  const birds2=()=>[bird('sparrow',42),bird('chick',67)];
  const birds3=()=>[bird('sparrow',32),bird('chick',56),bird('fledgling',79)];
  const extraLevels=[
    {
      id:'floodgate-crossing',title:'桥前有闸',subtitle:'前方的闸板挡着桥。先给桥板让出空间。',
      hint:'先拔中间闸板的销，让木板抬到鸟头上方，再放左边的桥。',
      solution:['gate','deck'],goal:[['deck']],winText:'闸板抬起来，桥面畅通了！',
      parts:[
        beam('deck',92,320,223),
        beam('gate',199,226,101,PI/2,'gate',0,17)
      ],
      pins:[
        latch('deck',92,185,'左侧过河桥销','deck'),
        latch('gate',199,273,'中间闸板锁销','gate'),
        latch('hinge',92,320,'桥底转轴销','deck','hinge')
      ],
      birds:birds2(),
      actions:[
        act('gate','闸板抬起，给过河桥让出了空间。',[go('gate',{angle:0},.49)]),
        act('deck','桥正在落下。',[leaf('deck')],{need:['gate'],fail:snap('桥板先撞上了没打开的闸板。','deck',-.22,191,302)}),
        act('hinge','主桥失去了转轴。',[],{fail:{message:'主桥的转轴要保留；该拔的是上面的锁销。',ops:[go('deck',{x:125,y:465,angle:.68},.70,'gravity')]}})
      ]
    },
    {
      id:'tethered-float',title:'有根绳不能拔',subtitle:'浮台能补上桥的缺口，但必须留下一根缆绳。',
      hint:'拔紧贴浮台的压舱销，保留下面的系岸销。浮台升起后再放两岸桥板。',
      solution:['float','left','right'],goal:[['left','right']],winText:'浮台被缆绳稳稳拴住，小鸟过河了！',
      parts:[
        beam('left',92,320,95),beam('right',309,320,96),
        beam('raft',201,376,76,-.07,'float',.5,24)
      ],
      links:[rope('raft',[244,448],{role:'tether'})],
      pins:[
        latch('float',200,376,'浮台压舱销','raft'),
        latch('tether',244,448,'系岸销','raft','hinge'),
        latch('left',92,248,'左岸桥板销','left'),
        latch('right',309,248,'右岸桥板销','right')
      ],
      birds:birds2(),
      actions:[
        act('float','浮台升到桥板下面了。',[go('raft',{y:332,angle:0},.65)]),
        act('tether','浮台顺着水流漂走了。',[],{fail:{message:'松开系岸绳，浮台就无法停在缺口下。',ops:[go('raft',{x:409,y:397,angle:.24},.78)]}}),
        act('left','左岸桥板接上浮台。',[wing('left')],{need:['float'],fail:snap('浮台还没升到桥面，左边接不上。','left',.9,177,408)}),
        act('right','右岸桥板接上浮台。',[wing('right')],{need:['float'],fail:snap('浮台还没升到桥面，右边接不上。','right',-PI-.9,224,407)})
      ]
    },
    {
      id:'ratchet-landing',title:'先扣住止回爪',subtitle:'配重能压平跷跷桥，但没有止回爪就会压过头。',
      hint:'先摆好左下的止回爪，让它挡在桥端下面，再放左侧配重。',
      solution:['brace','weight'],goal:[['weight']],winText:'止回爪卡住了水平桥面，过河！',
      parts:[
        beam('deck',201,320,226,.24,'wood',.5,15),
        beam('brace',108,362,45,.13,'brace',0,12),
        stone('weight',126,194)
      ],
      scenery:[{kind:'fulcrum',x:201,y:321,height:77,width:49}],
      links:[rope('weight',[126,143],{role:'rig'})],
      pins:[
        latch('brace',146,369,'桥端止回销','brace'),
        latch('weight',126,165,'配重吊绳销','weight'),
        latch('pivot',201,320,'中央轴销','deck','hinge')
      ],
      birds:birds2(),
      actions:[
        act('brace','止回爪站到桥端下方了。',[go('brace',{angle:UP},.4)]),
        act('weight','配重压住高端，止回爪接住了桥。',[drop('weight',278),go('deck',{angle:0},.47),go('weight',{x:73,y:302,angle:.29},.52)],{
          need:['brace'],fail:{message:'没有止回爪，配重把桥的左侧压进了河里。',ops:[drop('weight',300),{kind:'fail',id:'deck',angle:-.83,x:114,y:400}]}
        }),
        act('pivot','中央支点脱开了。',[],{fail:{message:'跷跷桥没有中央轴就会整个沉下去。',ops:[go('deck',{y:465,angle:.52},.74,'gravity')]}})
      ]
    },
    {
      id:'paired-piers',title:'左右各有一座墩',subtitle:'两座桥墩彼此独立。哪座升起来，就能先放哪一边。',
      hint:'左岸配重只抬左侧桥墩，右岸同理。可以左右交替，也可以先把两座墩都升起来。',
      solution:['leftLift','left','rightLift','right'],goal:[['left','right']],winText:'两座桥墩各撑一侧，桥接成了！',
      parts:[
        beam('left',92,320,113),beam('right',309,320,113),
        beam('pierL',180,412,87,UP,'brace',.5,16),beam('pierR',221,412,87,UP,'brace',.5,16),
        stone('leftWeight',151,182),stone('rightWeight',252,182)
      ],
      links:[rope('leftWeight','pierL',{role:'hoist',via:[167,150]}),rope('rightWeight','pierR',{role:'hoist',via:[234,150]})],
      pins:[
        latch('leftLift',151,156,'左桥墩配重销','leftWeight'),
        latch('rightLift',252,156,'右桥墩配重销','rightWeight'),
        latch('left',92,239,'左岸桥板销','left'),
        latch('right',309,239,'右岸桥板销','right')
      ],
      birds:birds2(),
      actions:[
        act('leftLift','左桥墩升到了桥下。',[drop('leftWeight',386),go('pierL',{y:371},.41)]),
        act('rightLift','右桥墩升到了桥下。',[drop('rightWeight',386),go('pierR',{y:371},.41)]),
        act('left','左桥板落稳了。',[wing('left')],{need:['leftLift'],fail:snap('左桥墩还没升起来。另一边的配重帮不了左桥板。','left',1.04,167,421)}),
        act('right','右桥板落稳了。',[wing('right')],{need:['rightLift'],fail:snap('右桥墩还没升起来。另一边的配重帮不了右桥板。','right',-PI-1.04,235,421)})
      ]
    },
    {
      id:'high-or-low',title:'随水势选路',subtitle:'浮筒能走低路，吊索能走高路。只有高处能捡回这根羽毛。',
      hint:'下方浮筒可以直接托住低桥；想拿羽毛，先放左侧配重，把吊索架起来再放桥。',
      solution:['float','deck'],bonusSolution:['hoist','deck'],bonus:1,goal:[['deck']],winText:'两边的桥板接上了，小鸟顺利过河。',
      parts:[
        beam('left',92,320,115),beam('right',309,320,115),
        beam('raft',201,383,49,0,'float',.5,22),
        beam('catch',200,399,61,UP,'brace',.5,15),
        stone('weight',156,175)
      ],
      feathers:[ftr('gold',201,267)],
      links:[rope('weight','catch',{role:'hoist',via:[176,151]})],
      pins:[
        latch('float',201,390,'低桥浮筒销','raft'),
        latch('hoist',156,150,'高桥吊索销','weight'),
        latch('deck',92,234,'两翼联动锁销','left')
      ],
      birds:birds2(),
      bonusRoute:'high',routeProfiles:{low:[[96,0],[199,25],[305,0]],high:[[96,0],[199,-25],[305,0]]},
      actions:[
        act('float','浮筒已经靠在低桥的对接点。',[go('raft',{y:356},.51)],{route:'low'}),
        act('hoist','配重拉起高桥支点，羽毛在那条路上。',[drop('weight',392),go('catch',{y:332},.66),feather('gold',201,274)],{route:'high'}),
        act('deck','两翼转向已经准备好的支点。',[],{
          any:['float','hoist'],
          variants:{low:[leaf('left',.225),leaf('right',-PI-.225)],high:[leaf('left',-.225),leaf('right',-PI+.225)]},
          fail:snap('先选一条路。没有浮筒或吊索，两翼找不到支点。','left',.95,192,420)
        })
      ]
    },
    {
      id:'stone-chute',title:'让石头自己开门',subtitle:'直接提闸能过河；铺好导槽，再让石头去开闸，会掉出一根羽毛。',
      hint:'想收羽毛：先放右边导槽，再放石头，最后放桥。没铺导槽的石头会堵住河口。',
      solution:['gate','deck'],bonusSolution:['chute','stone','deck'],bonus:1,goal:[['deck']],winText:'桥面清出来了，山雀安全到岸！',
      parts:[
        beam('deck',92,320,222),
        beam('gate',254,216,111,PI/2,'gate'),
        beam('chute',307,267,98,UP,'rail',0,12),
        stone('rock',223,137)
      ],
      feathers:[ftr('gold',256,205)],
      pins:[
        latch('deck',92,202,'过河桥锁销','deck'),
        latch('gate',254,263,'直提闸板销','gate'),
        latch('chute',307,226,'石块导槽销','chute'),
        latch('stone',223,113,'导槽石块销','rock')
      ],
      birds:birds2(),
      actions:[
        act('gate','闸板被手动提起来。',[go('gate',{angle:-.10},.43)]),
        act('chute','导槽给石头铺出了一条斜线。',[leaf('chute',-PI+.23)]),
        act('stone','石块滚过导槽，撞开闸板，也抖落了羽毛。',[
          drop('rock',227),go('rock',{x:253,y:238,angle:.47},.30,'gravity'),
          go('gate',{angle:-.1},.38),go('rock',{x:349,y:302,angle:.8},.42),
          feather('gold',258,296)
        ],{need:['chute'],fail:{message:'没铺导槽，石头掉在了桥板落点。',ops:[drop('rock',365),{kind:'fail',id:'gate',angle:1.16,x:232,y:383}]}}),
        act('deck','桥顺利穿过闸口。',[leaf('deck')],{any:['gate','stone'],fail:snap('闸板没抬起来，桥面顶在闸上了。','deck',-.2,238,303)})
      ]
    },
    {
      id:'crossing-party',title:'等三只都准备好',subtitle:'三只小鸟在等候闸后面。先把桥搭好，再一起开闸。',
      hint:'先放右侧短桥，再放长桥。等候闸是最后一步，不然小鸟会冲到断桥前。',
      solution:['right','deck','birds'],goal:[['birds']],winText:'三只小鸟，一只也没落下！',
      parts:[
        beam('deck',92,320,151),beam('right',309,320,80),
        beam('gate',98,242,79,PI/2,'gate',0,13)
      ],
      pins:[
        latch('right',309,264,'对岸短桥销','right'),
        latch('deck',92,177,'长桥锁销','deck'),
        latch('birds',98,276,'等候闸锁销','gate')
      ],
      birds:birds3(),
      actions:[
        act('right','对岸的短桥先落稳。',[wing('right')]),
        act('deck','两段桥接起来了，等候闸现在可以开。',[leaf('deck')],{need:['right'],fail:snap('长桥不能悬在水面上。先放短桥接住它。','deck',.96,197,416)}),
        act('birds','等候闸打开，三只山雀开始过河。',[go('gate',{angle:0},.49)],{need:['deck'],fail:{message:'还没连成桥。先让三只山雀在等候闸后面等一等。',ops:[go('gate',{angle:0},.41),{kind:'haltBirds'}]}})
      ]
    },
    {
      id:'two-golden-feathers',title:'一只托篮，两根羽毛',subtitle:'托篮展开后能接两根羽毛。你也可以不取羽毛，直接放桥。',
      hint:'先放托篮，再拔两根羽毛挡杆。已经落水的羽毛不影响通关。',
      solution:['deck'],bonusSolution:['tray','leftFeather','rightFeather','deck'],bonus:2,goal:[['deck']],winText:'山雀到家了，托篮留在桥边。',
      parts:[
        beam('deck',92,320,230),
        beam('tray',227,331,114,UP,'float',.5,12),
        beam('leftShutter',173,224,49,WINGR,'rail',0,10),
        beam('rightShutter',283,252,50,WINGR,'rail',0,10)
      ],
      feathers:[ftr('amber',145,207),ftr('gold',255,235)],
      pins:[
        latch('deck',92,163,'主桥锁销','deck'),
        latch('tray',227,355,'双羽托篮锁销','tray'),
        latch('leftFeather',145,224,'左侧羽毛挡杆销','leftShutter'),
        latch('rightFeather',255,252,'右侧羽毛挡杆销','rightShutter')
      ],
      birds:birds2(),
      actions:[
        act('tray','托篮已经打开，可以接住两侧的羽毛。',[go('tray',{angle:0},.47)]),
        act('leftFeather','左边的羽毛松开了。',[go('leftShutter',{angle:UP},.26)],{
          conditional:{after:'tray',yes:[feather('amber',174,302)],no:[loseFeather('amber',157,394)]}
        }),
        act('rightFeather','右边的羽毛松开了。',[go('rightShutter',{angle:UP},.26)],{
          conditional:{after:'tray',yes:[feather('gold',254,302)],no:[loseFeather('gold',262,398)]}
        }),
        act('deck','桥正在落下。',[leaf('deck')])
      ]
    },
    {
      id:'great-waterworks',title:'最后一座水闸',subtitle:'先清闸，再选浮台或旧托架。托架到位才会打开羽毛托板。',
      hint:'先开闸。用浮台直接过河，或者放配重升起桥墩，再推入旧托架，接住金羽毛。',
      solution:['gate','float','left','right'],bonusSolution:['gate','lift','brace','left','right'],bonus:1,
      goal:[['left','right']],winText:'最后一座桥合拢，三只山雀一起回家了！',
      parts:[
        beam('left',92,320,96),beam('right',309,320,88),
        beam('gate',177,218,103,PI/2,'gate',0,17),
        beam('raft',154,405,35,.08,'float',.5,22),
        beam('pier',204,411,72,UP,'brace',.5,16),
        beam('brace',320,320,33,-PI,'rail',0,14),
        beam('featherShelf',224,268,33,-PI,'rail',0,10),
        stone('weight',265,153)
      ],
      links:[rope('weight','pier',{role:'hoist',via:[247,139]})],
      feathers:[{...ftr('gold',203,252),physical:true,restingOn:'featherShelf'}],
      pins:[
        latch('gate',177,258,'中央水闸销','gate'),
        latch('float',154,405,'备用浮台压舱销','raft'),
        latch('lift',265,127,'旧桥配重销','weight'),
        latch('brace',297,320,'旧桥托架锁销','brace'),
        latch('left',92,225,'左翼桥板销','left'),
        latch('right',309,245,'右翼桥板销','right')
      ],
      birds:birds3(),
      actions:[
        act('gate','水闸抬高了，两条路选一条。',[go('gate',{y:104},.55)]),
        act('float','浮台补上了缺口。旧桥的联锁已扣住。',[go('raft',{y:324,angle:0},.48),go('raft',{x:204},.38)],{
          need:['gate'],locks:['lift','brace'],route:'float',
          fail:snap('水闸还没打开，浮台无法进入停靠槽。','raft',.32,166,406)
        }),
        act('lift','配重把桥墩升起来了。羽毛还在上方托板里。',[drop('weight',396),go('pier',{y:363},.46)],{
          need:['gate'],locks:['float'],route:'old',
          fail:{message:'水闸还没抬起来，吊索卡在了闸板下。',ops:[drop('weight',377),{kind:'fail',id:'gate',angle:1.31,x:187,y:392}]}
        }),
        act('brace','托架已接进桥墩，联动托板拉开，羽毛落到桥面。',[
          go('brace',{x:221},.55),releaseFeather('gold','featherShelf','brace',203,302)
        ],{
          need:['lift'],fail:snap('桥墩没升，旧托架下面没有受力点。','brace',.99,273,410)
        }),
        act('left','左翼连接了中间落脚点。',[wing('left')],{need:['gate'],any:['float','brace'],fail:snap('两岸之间还缺落脚点。先用浮台或旧桥托架。','left',1,173,409)}),
        act('right','右翼连接了中间落脚点。',[wing('right')],{need:['gate'],any:['float','brace'],fail:snap('两岸之间还缺落脚点。先用浮台或旧桥托架。','right',-PI-1,228,409)})
      ]
    }
  ];
  // Keep the first six stable for existing saves.
  levels.push(...extraLevels);
  levels.forEach((level,index)=>{
    level.chapter=Math.floor(index/5);
    level.par??=level.solution.length;
    level.bonus??=0;
    if(level.bonusSolution)level.bonusPar??=level.bonusSolution.length;
    level.pins.forEach((p,i)=>{p.order||=i+1;});
  });
  const clone = list => list.map(o=>({...o}));
  const unit = v => Math.max(0,Math.min(1,v));
  const ease = v => {v=unit(v);return v*v*(3-2*v);};
  const lerp = (a,b,t) => a+(b-a)*t;
  const easing = t => .5-.5*Math.cos(PI*unit(t));

  let state, queue=[], active=null, elapsed=0;
  function setPhase(phase, message) {
    state.phase=phase;
    if(message!==undefined) state.message=message;
  }
  function event(type, extra={}) {
    G.onEvent?.({type, level:state.index, ...extra});
  }
  function find(id) {
    return state.parts.find(p=>p.id===id);
  }
  function add(duration, update, enter=()=>{}, end=()=>{}) {
    queue.push({duration,update,enter,end});
  }
  function move(part,duration,props,curve=ease) {
    const pairs=Object.entries(props);
    let from;
    add(duration,t=>{
      const p=curve(t);
      pairs.forEach(([k,v],i)=>{part[k]=lerp(from[i],v,p);});
    },()=>{from=pairs.map(([k])=>part[k]);});
  }
  function hold(seconds) {add(seconds,()=>{});}
  function lose(reason) {
    return ()=>{
      setPhase('lose',reason);
      event('lose',{message:reason});
    };
  }
  function leave() {
    const actors=state.birds, start=actors.map(b=>b.x);
    const delay=.24, duration=1.86, speed=.15;
    add(duration+delay*(actors.length-1),t=>{
      actors.forEach((b,i)=>{
        const local=t>=1?1:unit((t*(duration+delay*(actors.length-1))-i*delay)/duration);
        const travel=easing(local);
        b.x=lerp(start[i],actors.length===1?366:actors.length===2?375-i*22:378-i*19,travel);
        let hop=0;
        if(local>0&&local<1) {
          const arc=Math.sin(PI*((local/speed)%1));
          hop=arc * (7+3*(b.id==='sparrow'));
          hop*=Math.min(1,local*18,(1-local)*16);
        }
        if(state.index===2 && local>0 && local<1) hop=Math.max(hop,Math.max(0,1-Math.abs(b.x-320)/40)*39);
        b.hop=hop;b.y=b.baseY+routeOffset(b.x)-hop;
        for(const f of state.feathers) {
          const routeOK=!state.level.bonusRoute||state.route===state.level.bonusRoute;
          const atFeather=b.x>=f.x&&(!f.physical||Math.abs(b.baseY+routeOffset(f.x)-f.y)<=12);
          if(!f.collected&&!f.lost&&(f.ready||state.featherReady)&&routeOK&&local>0&&atFeather){
            f.collected=true;state.bonus++;
            event('feather',{x:f.x,y:f.y,feather:f.id,bonus:state.bonus});
          }
        }
        if(local>=1&&!b.rescued){b.rescued=true;event('rescue',{x:b.x,y:b.y,bird:b.id});}
      });
    },()=>{setPhase('animating','桥搭好了，小鸟正在过河……');event('cross');},()=>{
      const message=levels[state.index].winText;
      setPhase('win',message);
      event('win',{message,bonus:state.bonus});
    });
  }
  function removePin(p) {
    p.removed=true;
    add(.16,t=>{p.pull=ease(t);});
    event('pin',{pin:p.id,x:p.x,y:p.y});
  }
  function resolveFirst(p) {
    const deck=find('bridge');
    if(p.id==='upper') {
      setPhase('animating','桥板正在落下……');
      move(deck,.56,{angle:.048},t=>t*t);
      add(.24,t=>{deck.angle=.048*(1-t)*Math.cos(t*PI*2);},()=>event('land',{x:305,y:320}));
      hold(.10);
      leave();
    } else {
      setPhase('animating','转轴松开了，桥板开始下滑……');
      move(deck,.72,{y:458,x:125,angle:.77},t=>t*t);
      add(.23,t=>{deck.opacity=1-t;deck.y=458+18*t;},()=>event('splash',{x:126,y:435}),lose('抽掉底部转轴，桥板就会掉进河里。'));
    }
  }
  function resolveSecond(p) {
    const long=find('bridge'),short=find('extension');
    if(p.id==='support') {
      setPhase('animating','短桥正在放下……');
      move(short,.42,{angle:-PI-.065},t=>t*t);
      add(.18,t=>{short.angle=-PI-.065*(1-t)*Math.cos(t*PI*2);},()=>event('land',{x:266,y:320}),()=>{
        state.supported=true;
        setPhase('ready','短桥已就位。现在可以放下长桥。');
      });
    } else if (state.supported) {
      setPhase('animating','长桥正在落下……');
      move(long,.56,{angle:.045},t=>t*t);
      add(.20,t=>{long.angle=.045*(1-t)*Math.cos(t*PI*2);},()=>event('land',{x:268,y:320}));
      hold(.10);
      leave();
    } else {
      setPhase('animating','长桥够不到对岸，再往下就要掉进河了……');
      move(long,.76,{angle:1.28},t=>t*t);
      add(.32,t=>{long.angle=1.28+.20*t;},()=>{long.damaged=true;event('splash',{x:141,y:435});},lose('长桥够不到对岸。先放下短桥，就能接住它。'));
    }
  }
  function resolveThird(p) {
    const deck=find('bridge'), stone=find('counterweight');
    if(p.id==='weight') {
      setPhase('animating','配重正在下落……');
      move(stone,.43,{y:276},t=>t*t);
      add(.43,t=>{
        const p=ease(t);
        deck.angle=lerp(-.29,.034,p);
        stone.y=lerp(276,296,p);
        stone.angle=.10*Math.sin(p*PI);
      },()=>event('land',{x:277,y:290}));
      add(.18,t=>{deck.angle=.034*(1-t)*Math.cos(t*PI*2);stone.y=296-1.7*Math.sin(t*PI);});
      // The tilted bridge briefly overshoots, sliding its weight toward the
      // right landing before the bridge catches against the bank.
      move(stone,.43,{x:320,y:302,angle:.12},ease);
      add(.15,t=>{stone.angle=.12*(1-t);},()=>event('weightSet',{x:320,y:320}));
      leave();
    } else {
      setPhase('animating','跷跷桥失去支撑了……');
      move(deck,.60,{x:213,y:458,angle:.62},t=>t*t);
      add(.26,t=>{deck.opacity=1-t;},()=>event('splash',{x:218,y:435}),lose('没有中间转轴，整个跷跷桥都会掉下去。'));
    }
  }

  function waitForChoice(message) {
    setPhase('ready',message);
  }
  function placeWing(p, duration, right, onFinish) {
    const full=right?-PI:0, flex=right?-.048:.048;
    move(p,duration,{angle:full+flex},t=>t*t);
    add(.18,t=>{p.angle=full+flex*(1-t)*Math.cos(t*PI*2);},
      ()=>event('land',{x:p.x+(right?-p.length:p.length),y:p.y}),onFinish);
  }
  function failedLeaf(p, right, message) {
    const angle=right?-PI:0, dip=right?-.88:.88;
    move(p,.63,{angle:angle+dip},t=>t*t);
    add(.27,t=>{p.angle=angle+dip+(right?-.36:.36)*t;},()=>{
      p.damaged=true;
      event('splash',{x:p.x+(right?-p.length:p.length)*.72,y:421});
    },lose(message));
  }
  function raisePier(weight,pier,dy,y,onFinish) {
    move(weight,.57,{y,angle:.12},t=>t*t);
    move(pier,.42,{y:dy},ease);
    add(.08,()=>{},()=>event('weightSet',{x:weight.x,y:weight.y}),onFinish);
  }
  function resolveFourth(p) {
    if(p.id==='lift') {
      setPhase('animating','配重落下，把河中央的桥墩拉起来。');
      raisePier(find('hoistWeight'),find('pier'),375,377,()=>{
        state.supported=true;
        waitForChoice('桥墩到位。现在可以放下左右两块桥板。');
      });
      return;
    }
    const right=p.id==='right', wing=find(right?'rightWing':'leftWing');
    if(!state.supported) {
      setPhase('animating','桥板下面没有桥墩……');
      failedLeaf(wing,right,'桥墩还没升起来，单边桥板没有支撑。');
      return;
    }
    setPhase('animating',right?'正在放下右侧桥板……':'正在放下左侧桥板……');
    if(state.pins.find(a=>a.id===(right?'left':'right')).removed){
      placeWing(wing,.49,right,()=>{});
      leave();
    } else {
      placeWing(wing,.49,right,()=>waitForChoice(right?'右翼已落稳，还差左翼。':'左翼已落稳，还差右翼。'));
    }
  }
  function resolveFifth(p) {
    const f=state.feathers[0];
    if(p.id==='tray') {
      setPhase('animating','托盘正在展开……');
      placeWing(find('tray'),.43,true,()=>{
        state.trayReady=true;
        waitForChoice(f.lost?'托盘到位了，但羽毛已经飘走。仍然可以放桥过河。':'托盘到位。现在可以松开羽毛的挡板。');
      });
    } else if(p.id==='feather') {
      setPhase('animating','金羽毛开始向下飘……');
      move(find('featherLatch'),.32,{angle:UP},ease);
      if(state.trayReady) {
        move(f,.57,{y:302,x:197},ease);
        add(.11,()=>{},()=>event('land',{x:f.x,y:317}),()=>{
          state.featherReady=true;
          waitForChoice('托盘接住了金羽毛。放下桥板就能把它带走。');
        });
      } else {
        move(f,.62,{x:211,y:404,opacity:.12},ease);
        add(.13,t=>{f.opacity=.12*(1-t);},()=>event('splash',{x:f.x,y:410}),()=>{
          f.lost=true;
          waitForChoice('羽毛落水了，但小鸟还有路回家。放下桥板吧。');
        });
      }
    } else {
      setPhase('animating','过河的桥正在放下……');
      placeWing(find('bridge'),.52,false,()=>{});
      leave();
    }
  }
  function resolveSixth(p) {
    const short=find('short'), f=state.feathers[0];
    if(p.id==='lift') {
      setPhase('animating','配重落下，支起短桥的桥墩。羽毛也松动了。');
      raisePier(find('weight'),find('pier'),371,371,()=>{state.supported=true;});
      move(f,.53,{y:304,x:260},ease);
      add(.05,()=>{},()=>{},()=>{
        state.featherReady=true;
        waitForChoice(state.rightReady?'羽毛已到落脚处。现在放下主桥。':'桥墩升好了。放下上方短桥，或改用备用托架。');
      });
    } else if(p.id==='brace') {
      setPhase('animating','备用托架从河边向上转动……');
      move(find('brace'),.57,{angle:PI},ease);
      const latch=state.pins.find(a=>a.id==='short');
      const finish=()=>{
        state.rightReady=true;
        state.route??='brace';
        waitForChoice('备用托架接住了短桥。可以放下主桥。');
      };
      if(latch.removed){
        add(.12,()=>{},()=>event('land',{x:229,y:333}),finish);
      } else {
        add(.16,t=>{latch.pull=ease(t);},()=>{
          latch.removed=true;
          event('pin',{pin:latch.id,x:latch.x,y:latch.y,automatic:true});
        });
        placeWing(short,.45,true,finish);
      }
    } else if(p.id==='short') {
      if(!state.supported&&!state.rightReady) {
        setPhase('animating','短桥下面还没有支点……');
        failedLeaf(short,true,'没有桥墩或备用托架，短桥没有支撑。');
      } else {
        setPhase('animating','短桥正在落向支点……');
        placeWing(short,.49,true,()=>{
          state.rightReady=true;
          state.route??='lift';
          waitForChoice('右岸桥段已经就位，现在放下主桥。');
        });
      }
    } else if(!state.rightReady) {
      setPhase('animating','主桥够不到桥对面……');
      failedLeaf(find('bridge'),false,'主桥够不到右岸。先用备用托架，或架好上方短桥。');
    } else {
      setPhase('animating','最后一段主桥正在放下……');
      placeWing(find('bridge'),.54,false,()=>{});
      leave();
    }
  }
  const graphAction=(cfg,id)=>cfg.actions.find(a=>a.id===id);
  const isOpen=(cfg,done)=>cfg.goal.some(goal=>goal.every(id=>done.has(id)));
  function lawful(action,done) {
    return !(action.fail&&!action.need&&!action.any) &&
      (!action.need||action.need.every(id=>done.has(id))) &&
      (!action.any||action.any.some(id=>done.has(id)));
  }
  function graphOps(action,done,route) {
    const ops=[...action.ops];
    if(action.conditional) ops.push(...(done.has(action.conditional.after)?action.conditional.yes:action.conditional.no));
    if(action.variants) ops.push(...(action.variants[route]||[]));
    return ops;
  }
  function graphFX(op){
    const p=find(op.id);
    if(op.kind==='move'){
      move(p,op.seconds,op.props,op.curve==='gravity'?t=>t*t:ease);
    } else if(op.kind==='leaf'){
      const flex=op.angle<-1?-.045:.045;
      move(p,.44,{angle:op.angle+flex},t=>t*t);
      add(.16,t=>{p.angle=op.angle+flex*(1-t)*Math.cos(t*PI*2);},()=>event('land',{
        x:op.x??(p.x+p.length*Math.cos(op.angle)*(1-p.anchor)),
        y:op.y??(p.y+p.length*Math.sin(op.angle)*(1-p.anchor))
      }));
    } else if(op.kind==='fail'){
      move(p,.48,{angle:op.angle},t=>t*t);
      add(.18,t=>{p.opacity=1-t*.21;},()=>{
        p.damaged=true;
        event('splash',{x:op.x??p.x,y:op.y??p.y});
      });
    } else if(op.kind==='releaseFeather'){
      const f=state.feathers.find(f=>f.id===op.id),shelf=find(op.shelf),retract=54;
      let initialShelfX,initialFeatherY;
      add(.76,t=>{
        shelf.x=initialShelfX+retract*ease(t);
        if(t<.44)return;
        const fall=unit((t-.44)/.56);
        f.restingOn=null;
        f.x=op.x;
        f.y=lerp(initialFeatherY,op.y,fall*fall);
      },()=>{
        initialShelfX=shelf.x;initialFeatherY=f.y;
      },()=>{
        f.ready=true;f.restingOn=op.restingOn;
        event('land',{x:f.x,y:f.y+11});
      });
    } else if(op.kind==='feather'||op.kind==='featherLost'){
      const f=state.feathers.find(f=>f.id===op.id),lost=op.kind==='featherLost';
      move(f,.6,{x:op.x,y:op.y,opacity:lost?0:1},ease);
      add(.02,()=>{},()=>{},()=>{
        f.ready=op.kind==='feather';f.lost=lost;
        if(lost)event('splash',{x:f.x,y:f.y});
      });
    } else if(op.kind==='haltBirds'){
      let starts;
      add(.49,t=>{
        for(const [i,b] of state.birds.entries()){
          b.x=lerp(starts[i],75+7*i,ease(t));
          b.y=b.baseY-Math.sin(t*PI)*5;
        }
      },()=>{starts=state.birds.map(b=>b.x);});
    }
  }
  function resolveGraph(p){
    const cfg=state.level,a=graphAction(cfg,p.id),before=new Set(state.history.slice(0,-1));
    if(!a)return;
    setPhase('animating',a.message);
    if(!lawful(a,before)){
      const outcome=a.fail;
      outcome.ops.forEach(graphFX);
      add(.10,()=>{},()=>{},lose(outcome.message));
      return;
    }
    if(a.route)state.route=a.route;
    for(const id of a.locks||[]){
      const pin=state.pins.find(item=>item.id===id);
      if(pin&&!pin.removed)pin.locked=true;
    }
    graphOps(a,before,state.route).forEach(graphFX);
    if(isOpen(cfg,new Set(state.history)))leave();
    else add(.035,()=>{},()=>{},()=>setPhase('ready',a.message));
  }
  function graphLocked(cfg,done,id) {
    return cfg.actions.some(action=>done.has(action.id)&&action.locks?.includes(id));
  }
  function graphHint(preferBonus){
    const {level:cfg}=state,initial={
      done:new Set(state.history), route:state.route, available:new Set(state.feathers.filter(f=>f.ready).map(f=>f.id)),
      lost:new Set(state.feathers.filter(f=>f.lost).map(f=>f.id)), first:null
    };
    const frontier=[initial],seen=new Set(); let best=null,bestCount=-1;
    for(let i=0;i<frontier.length;i++){
      const current=frontier[i];
      for(const pin of cfg.pins){
        const id=pin.id,a=graphAction(cfg,id);
        if(current.done.has(id)||!a||graphLocked(cfg,current.done,id)||!lawful(a,current.done))continue;
        const done=new Set([...current.done,id]),route=a.route||current.route,
          available=new Set(current.available),lost=new Set(current.lost),first=current.first||id;
        for(const op of graphOps(a,current.done,route)){
          if((op.kind==='feather'||op.kind==='releaseFeather')&&!lost.has(op.id))available.add(op.id);
          if(op.kind==='featherLost'){lost.add(op.id);available.delete(op.id);}
        }
        if(isOpen(cfg,done)){
          const count=cfg.bonusRoute&&route!==cfg.bonusRoute?0:available.size;
          if(!preferBonus||count>=cfg.bonus)return first;
          if(count>bestCount){bestCount=count;best=first;}
        } else {
          const key=[...done].sort().join(',')+'|'+route+'|'+[...available].sort().join(',')+'|'+[...lost].sort().join(',');
          if(!seen.has(key)){seen.add(key);frontier.push({done,route,available,lost,first});}
        }
      }
    }
    return best;
  }
  function routeOffset(x){
    const points=state.level.routeProfiles?.[state.route];
    if(!points||x<=points[0][0]||x>=points[points.length-1][0])return 0;
    for(let i=1;i<points.length;i++){
      const [b,by]=points[i];
      if(x<=b){const [a,ay]=points[i-1];return lerp(ay,by,(x-a)/(b-a));}
    }
    return 0;
  }

  const G={
    world,levels,onEvent:null,
    get state(){return state;},
    load(index=0){
      const cfg=levels[index];
      if(!cfg)return false;
      queue=[];active=null;elapsed=0;
      state={index,level:cfg,phase:'ready',message:cfg.subtitle,parts:clone(cfg.parts),pins:clone(cfg.pins),
        birds:clone(cfg.birds),feathers:clone(cfg.feathers||[]),bonus:0,featherReady:false,
        supported:false,trayReady:false,rightReady:false,route:null,moves:0,history:[]};
      event('load');
      return true;
    },
    tap(id){
      if(!state||state.phase!=='ready')return false;
      const p=state.pins.find(p=>p.id===id);
      if(!p||p.removed||p.locked)return false;
      state.moves++;state.history.push(id);
      setPhase('animating');
      removePin(p);
      if(state.level.actions)resolveGraph(p);
      else [resolveFirst,resolveSecond,resolveThird,resolveFourth,resolveFifth,resolveSixth][state.index](p);
      return true;
    },
    hintPin(preference=false){
      if(state.phase!=='ready') return null;
      const preferBonus=preference===true||preference?.bonus===true;
      if(state.level.actions)return graphHint(preferBonus);
      const unused=id=>state.pins.some(p=>p.id===id&&!p.removed);
      if(state.index===4) {
        if(preferBonus&&unused('feather')) return state.trayReady?'feather':'tray';
        return 'deck';
      }
      if(state.index===5){
        if(preferBonus&&unused('lift')) return 'lift';
        if(state.rightReady) return 'deck';
        return state.supported?'short':'brace';
      }
      return state.level.solution.find(unused)||null;
    },
    tick(dt){
      if(!Number.isFinite(dt)||dt<=0)return;
      let remaining=dt;
      while(remaining>1e-8){
        if(!active){
          active=queue.shift();
          if(!active)break;
          elapsed=0;active.enter();
        }
        const step=Math.min(remaining,active.duration-elapsed);
        remaining-=step;elapsed+=step;
        const completed=elapsed>=active.duration-1e-8;
        active.update(completed?1:elapsed/active.duration);
        if(completed){
          const done=active;
          active=null;done.end();
        }
      }
    }
  };
  globalThis.BridgeGame=G;
  G.load(0);
})();
