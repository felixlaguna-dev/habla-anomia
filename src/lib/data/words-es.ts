import type { Word } from '$lib/types';

export const WORDS_ES: Word[] = [
  // ==========================================
  // ANIMALS (20 words)
  // ==========================================
  {
    id: 'es-animal-001',
    word: 'perro',
    category: 'animals',
    language: 'es',
    image_url: '/images/words/perro.webp',
    definition: 'Animal doméstico mamífero, fiel compañero del ser humano.',
    features: {
      category: 'animal doméstico',
      function: 'compañía, guardián',
      location: 'hogar, calle, campo',
      properties: 'tiene cuatro patas, ladra, tiene pelo',
      associations: 'huella, collar, hueso, perrera'
    },
    phonetic: { first_sound: '/p/', syllables: 2, rhyming_word: 'fierro', first_phonemes: '/pe/' },
    difficulty: 1,
    tags: ['doméstico', 'mamífero', 'común'],
    sentence: 'El _____ juega en el parque con su pelota.',
    opposite: '',
    synonyms: ['can', 'chucho']
  },
  {
    id: 'es-animal-002',
    word: 'gato',
    category: 'animals',
    language: 'es',
    image_url: '/images/words/gato.webp',
    definition: 'Animal doméstico felino, independiente y ágil.',
    features: {
      category: 'animal doméstico',
      function: 'compañía, cazar ratones',
      location: 'hogar, tejados, jardines',
      properties: 'tiene cuatro patas, maúlla, tiene bigotes',
      associations: 'ratón, leche, ronroneo, garra'
    },
    phonetic: { first_sound: '/g/', syllables: 2, rhyming_word: 'zapato', first_phonemes: '/ga/' },
    difficulty: 1,
    tags: ['doméstico', 'felino', 'común'],
    sentence: 'El _____ duerme sobre el sofá todas las tardes.',
    opposite: '',
    synonyms: ['felino', 'minino']
  },
  {
    id: 'es-animal-003',
    word: 'pájaro',
    category: 'animals',
    language: 'es',
    image_url: '/images/words/pajaro.webp',
    definition: 'Animal vertebrado con plumas y alas que puede volar.',
    features: {
      category: 'animal salvaje',
      function: 'volar, cantar',
      location: 'cielo, árboles, campos',
      properties: 'tiene alas, plumas y pico',
      associations: 'nido, canto, vuelo, pluma'
    },
    phonetic: { first_sound: '/p/', syllables: 2, rhyming_word: 'ataro', first_phonemes: '/pa/' },
    difficulty: 2,
    tags: ['salvaje', 'ave', 'común'],
    sentence: 'El _____ canta en la rama del árbol por la mañana.',
    opposite: '',
    synonyms: ['ave', 'pajarillo']
  },
  {
    id: 'es-animal-004',
    word: 'pez',
    category: 'animals',
    language: 'es',
    image_url: '/images/words/pez.webp',
    definition: 'Animal acuático vertebrado que respira por branquias.',
    features: {
      category: 'animal acuático',
      function: 'nadar',
      location: 'río, mar, lago, acuario',
      properties: 'tiene aletas y escamas',
      associations: 'agua, acuario, caña, aleta'
    },
    phonetic: { first_sound: '/p/', syllables: 1, rhyming_word: 'vez', first_phonemes: '/pe/' },
    difficulty: 1,
    tags: ['acuático', 'común'],
    sentence: 'El _____ nada rápidamente en el acuario.',
    opposite: '',
    synonyms: ['pescado']
  },
  {
    id: 'es-animal-005',
    word: 'caballo',
    category: 'animals',
    language: 'es',
    image_url: '/images/words/caballo.webp',
    definition: 'Animal mamífero grande usado para montar y transportar.',
    features: {
      category: 'animal doméstico',
      function: 'montar, transportar, deporte',
      location: 'campo, establo, pradera',
      properties: 'tiene cuatro patas, crin, relincha',
      associations: 'silla de montar, establo, carreras, jinete'
    },
    phonetic: { first_sound: '/k/', syllables: 3, rhyming_word: 'allo', first_phonemes: '/ka/' },
    difficulty: 2,
    tags: ['doméstico', 'mamífero', 'grande'],
    sentence: 'El _____ galopa por la pradera a gran velocidad.',
    opposite: '',
    synonyms: ['corcel', 'potro']
  },
  {
    id: 'es-animal-006',
    word: 'vaca',
    category: 'animals',
    language: 'es',
    image_url: '/images/words/vaca.webp',
    definition: 'Animal mamífero doméstico que produce leche.',
    features: {
      category: 'animal de granja',
      function: 'producir leche, carne',
      location: 'granja, prado, establo',
      properties: 'tiene manchas blancas y negras, muge',
      associations: 'leche, toro, granja, prado'
    },
    phonetic: { first_sound: '/b/', syllables: 2, rhyming_word: 'baca', first_phonemes: '/ba/' },
    difficulty: 1,
    tags: ['granja', 'mamífero', 'común'],
    sentence: 'La _____ pasta tranquilamente en el prado.',
    opposite: '',
    synonyms: ['res', 'bovino']
  },
  {
    id: 'es-animal-007',
    word: 'cerdo',
    category: 'animals',
    language: 'es',
    image_url: '/images/words/cerdo.webp',
    definition: 'Animal mamífero de granja con hocico ancho.',
    features: {
      category: 'animal de granja',
      function: 'producir carne',
      location: 'granja, chiquero',
      properties: 'tiene hocico ancho, es rosado, gruñe',
      associations: 'granja, barro, jamón, chiquero'
    },
    phonetic: { first_sound: '/θ/', syllables: 2, rhyming_word: 'uerdo', first_phonemes: '/θe/' },
    difficulty: 2,
    tags: ['granja', 'mamífero'],
    sentence: 'El _____ busca comida en el barro del corral.',
    opposite: '',
    synonyms: ['porcino', 'chancho']
  },
  {
    id: 'es-animal-008',
    word: 'oveja',
    category: 'animals',
    language: 'es',
    image_url: '/images/words/oveja.webp',
    definition: 'Animal mamífero doméstico cubierto de lana.',
    features: {
      category: 'animal de granja',
      function: 'producir lana, leche',
      location: 'granja, prado, montaña',
      properties: 'tiene lana blanca espesa, bala',
      associations: 'lana, pastor, rebaño, cordero'
    },
    phonetic: { first_sound: '/o/', syllables: 3, rhyming_word: 'abeja', first_phonemes: '/o/' },
    difficulty: 2,
    tags: ['granja', 'mamífero'],
    sentence: 'La _____ produce lana que se usa para hacer jersey.',
    opposite: '',
    synonyms: ['cordero', 'borrego']
  },
  {
    id: 'es-animal-009',
    word: 'gallina',
    category: 'animals',
    language: 'es',
    image_url: '/images/words/gallina.webp',
    definition: 'Ave doméstica que pone huevos.',
    features: {
      category: 'animal de granja',
      function: 'poner huevos, producir carne',
      location: 'granja, corral, gallinero',
      properties: 'tiene plumas, pico, cacarea',
      associations: 'huevo, gallo, pollito, corral'
    },
    phonetic: { first_sound: '/g/', syllables: 3, rhyming_word: 'encina', first_phonemes: '/ga/' },
    difficulty: 1,
    tags: ['granja', 'ave', 'común'],
    sentence: 'La _____ pone huevos en el gallinero cada día.',
    opposite: '',
    synonyms: ['ave', 'clueca']
  },
  {
    id: 'es-animal-010',
    word: 'conejo',
    category: 'animals',
    language: 'es',
    image_url: '/images/words/conejo.webp',
    definition: 'Animal mamífero con orejas largas y cola corta.',
    features: {
      category: 'animal doméstico y salvaje',
      function: 'compañía, carne',
      location: 'campo, madriguera, hogar',
      properties: 'tiene orejas largas, cola de algodón, salta',
      associations: 'zanahoria, madriguera, orejas, salto'
    },
    phonetic: { first_sound: '/k/', syllables: 3, rhyming_word: 'ajo', first_phonemes: '/ko/' },
    difficulty: 1,
    tags: ['doméstico', 'mamífero', 'común'],
    sentence: 'El _____ salta por el jardín buscando zanahorias.',
    opposite: '',
    synonyms: ['cunicular']
  },
  {
    id: 'es-animal-011',
    word: 'león',
    category: 'animals',
    language: 'es',
    image_url: '/images/words/leon.webp',
    definition: 'Gran felino carnívoro conocido como el rey de la selva.',
    features: {
      category: 'animal salvaje',
      function: 'depredador',
      location: 'sabana, selva, zoológico',
      properties: 'tiene melena, ruge, es muy fuerte',
      associations: 'selva, melena, rugido, sabana'
    },
    phonetic: { first_sound: '/l/', syllables: 2, rhyming_word: 'campeón', first_phonemes: '/le/' },
    difficulty: 2,
    tags: ['salvaje', 'felino', 'grande'],
    sentence: 'El _____ ruge con fuerza en la sabana africana.',
    opposite: '',
    synonyms: ['felino']
  },
  {
    id: 'es-animal-012',
    word: 'elefante',
    category: 'animals',
    language: 'es',
    image_url: '/images/words/elefante.webp',
    definition: 'El animal terrestre más grande, con trompa y colmillos.',
    features: {
      category: 'animal salvaje',
      function: 'usar trompa para comer y beber',
      location: 'sabana, selva, zoológico',
      properties: 'tiene trompa, colmillos, orejas grandes',
      associations: 'trompa, colmillo, marfil, sabana'
    },
    phonetic: { first_sound: '/e/', syllables: 4, rhyming_word: 'instante', first_phonemes: '/e/' },
    difficulty: 2,
    tags: ['salvaje', 'mamífero', 'grande'],
    sentence: 'El _____ usa su trompa para beber agua del río.',
    opposite: '',
    synonyms: ['proboscídeo']
  },
  {
    id: 'es-animal-013',
    word: 'serpiente',
    category: 'animals',
    language: 'es',
    image_url: '/images/words/serpiente.webp',
    definition: 'Reptil sin patas que se desliza arrastrándose.',
    features: {
      category: 'animal salvaje',
      function: 'depredador, control de plagas',
      location: 'bosque, desierto, jungla',
      properties: 'no tiene patas, tiene escamas, silba',
      associations: 'veneno, siseo, escamas, reptil'
    },
    phonetic: { first_sound: '/s/', syllables: 3, rhyming_word: 'creciente', first_phonemes: '/se/' },
    difficulty: 3,
    tags: ['salvaje', 'reptil'],
    sentence: 'La _____ se desliza silenciosamente entre las rocas.',
    opposite: '',
    synonyms: ['culebra', 'víbora']
  },
  {
    id: 'es-animal-014',
    word: 'mariposa',
    category: 'animals',
    language: 'es',
    image_url: '/images/words/mariposa.webp',
    definition: 'Insecto volador con alas coloridas.',
    features: {
      category: 'insecto',
      function: 'polinizar flores',
      location: 'jardines, campos, flores',
      properties: 'tiene alas coloridas, vuela de flor en flor',
      associations: 'flor, alas, colores, oruga'
    },
    phonetic: { first_sound: '/m/', syllables: 4, rhyming_word: 'cosa', first_phonemes: '/ma/' },
    difficulty: 2,
    tags: ['insecto', 'común'],
    sentence: 'La _____ vuela de flor en flor en el jardín.',
    opposite: '',
    synonyms: ['lepidóptero']
  },
  {
    id: 'es-animal-015',
    word: 'abeja',
    category: 'animals',
    language: 'es',
    image_url: '/images/words/abeja.webp',
    definition: 'Insecto volador que produce miel y poliniza flores.',
    features: {
      category: 'insecto',
      function: 'producir miel, polinizar',
      location: 'colmena, jardines, campos',
      properties: 'tiene rayas amarillas y negras, pica, zumba',
      associations: 'miel, colmena, flor, zumbido'
    },
    phonetic: { first_sound: '/a/', syllables: 3, rhyming_word: 'oveja', first_phonemes: '/a/' },
    difficulty: 2,
    tags: ['insecto', 'común'],
    sentence: 'La _____ recolecta néctar de las flores para hacer miel.',
    opposite: '',
    synonyms: ['apiano']
  },
  {
    id: 'es-animal-016',
    word: 'tortuga',
    category: 'animals',
    language: 'es',
    image_url: '/images/words/tortuga.webp',
    definition: 'Reptil con caparazón que se mueve muy despacio.',
    features: {
      category: 'reptil',
      function: 'compañía',
      location: 'tierra, agua, jardín',
      properties: 'tiene caparazón, camina muy lento',
      associations: 'caparazón, lentitud, caracol, lentísimo'
    },
    phonetic: { first_sound: '/t/', syllables: 3, rhyming_word: 'fruta', first_phonemes: '/to/' },
    difficulty: 2,
    tags: ['reptil', 'común'],
    sentence: 'La _____ camina lentamente con su caparazón a cuestas.',
    opposite: '',
    synonyms: ['quelonio']
  },
  {
    id: 'es-animal-017',
    word: 'mono',
    category: 'animals',
    language: 'es',
    image_url: '/images/words/mono.webp',
    definition: 'Animal mamífero parecido al humano, ágil y trepador.',
    features: {
      category: 'animal salvaje',
      function: 'trepar, saltar',
      location: 'selva, bosque tropical, zoológico',
      properties: 'tiene cola, es ágil, trepa árboles',
      associations: 'selva, plátano, árbol, chimpancé'
    },
    phonetic: { first_sound: '/m/', syllables: 2, rhyming_word: 'cono', first_phonemes: '/mo/' },
    difficulty: 1,
    tags: ['salvaje', 'mamífero'],
    sentence: 'El _____ salta de rama en rama en la selva.',
    opposite: '',
    synonyms: ['simio', 'primate']
  },
  {
    id: 'es-animal-018',
    word: 'oso',
    category: 'animals',
    language: 'es',
    image_url: '/images/words/oso.webp',
    definition: 'Gran mamífero carnívoro de cuerpo robusto y pelaje espeso.',
    features: {
      category: 'animal salvaje',
      function: 'depredador',
      location: 'bosque, montaña, tundra',
      properties: 'es grande, tiene pelaje espeso, hiberna',
      associations: 'bosque, miel, cueva, osezno'
    },
    phonetic: { first_sound: '/o/', syllables: 2, rhyming_word: 'coso', first_phonemes: '/o/' },
    difficulty: 1,
    tags: ['salvaje', 'mamífero', 'grande'],
    sentence: 'El _____ busca miel en el tronco del árbol.',
    opposite: '',
    synonyms: ['plantígrado', 'ursido']
  },
  {
    id: 'es-animal-019',
    word: 'águila',
    category: 'animals',
    language: 'es',
    image_url: '/images/words/aguila.webp',
    definition: 'Ave rapaz de gran tamaño con vista aguda.',
    features: {
      category: 'animal salvaje',
      function: 'cazar desde el aire',
      location: 'montañas, cielos, acantilados',
      properties: 'tiene alas grandes, pico ganchudo, vista aguda',
      associations: 'vuelo, montaña, nido, cielo'
    },
    phonetic: { first_sound: '/a/', syllables: 3, rhyming_word: 'familia', first_phonemes: '/a/' },
    difficulty: 3,
    tags: ['salvaje', 'ave rapaz'],
    sentence: 'El _____ sobrevuela las montañas buscando presas.',
    opposite: '',
    synonyms: ['rapaz', 'ave rapaz']
  },
  {
    id: 'es-animal-020',
    word: 'delfín',
    category: 'animals',
    language: 'es',
    image_url: '/images/words/delfin.webp',
    definition: 'Mamífero marino inteligente y juguetón.',
    features: {
      category: 'animal marino',
      function: 'nadar, saltar',
      location: 'mar, océano, acuario',
      properties: 'es gris, nada rápido, silba',
      associations: 'mar, océano, salto, inteligencia'
    },
    phonetic: { first_sound: '/d/', syllables: 2, rhyming_word: 'alfín', first_phonemes: '/de/' },
    difficulty: 2,
    tags: ['marino', 'mamífero'],
    sentence: 'El _____ salta sobre las olas en el océano.',
    opposite: '',
    synonyms: ['cetáceo', 'delfínido']
  },

  // ==========================================
  // FOOD (25 words)
  // ==========================================
  {
    id: 'es-food-001',
    word: 'pan',
    category: 'food',
    language: 'es',
    image_url: '/images/words/pan.webp',
    definition: 'Alimento básico hecho de harina, agua y levadura horneado.',
    features: {
      category: 'alimento básico',
      function: 'alimentarse, acompañar comidas',
      location: 'panadería, cocina, supermercado',
      properties: 'es suave por dentro, crujiente por fuera',
      associations: 'harina, trigo, panadería, tostada'
    },
    phonetic: { first_sound: '/p/', syllables: 1, rhyming_word: 'san', first_phonemes: '/pa/' },
    difficulty: 1,
    tags: ['básico', 'horneado', 'común'],
    sentence: 'Compré _____ fresco en la panadería de la esquina.',
    opposite: '',
    synonyms: ['barrita', 'hogaza']
  },
  {
    id: 'es-food-002',
    word: 'leche',
    category: 'food',
    language: 'es',
    image_url: '/images/words/leche.webp',
    definition: 'Líquido blanco nutritivo producido por las vacas.',
    features: {
      category: 'bebida, lácteo',
      function: 'alimentarse, beber',
      location: 'nevera, supermercado, granja',
      properties: 'es blanca, líquida, nutritiva',
      associations: 'vaca, vaso, desayuno, calcio'
    },
    phonetic: { first_sound: '/l/', syllables: 2, rhyming_word: 'echa', first_phonemes: '/le/' },
    difficulty: 1,
    tags: ['lácteo', 'bebida', 'común'],
    sentence: 'Me tomo un vaso de _____ todas las mañanas.',
    opposite: '',
    synonyms: ['lácteo']
  },
  {
    id: 'es-food-003',
    word: 'agua',
    category: 'food',
    language: 'es',
    image_url: '/images/words/agua.webp',
    definition: 'Líquido incoloro e insípido esencial para la vida.',
    features: {
      category: 'bebida',
      function: 'hidratar, cocinar',
      location: 'grifo, botella, río',
      properties: 'es transparente, líquida, no tiene olor',
      associations: 'sed, grifo, botella, beber'
    },
    phonetic: { first_sound: '/a/', syllables: 2, rhyming_word: 'nagua', first_phonemes: '/a/' },
    difficulty: 1,
    tags: ['bebida', 'esencial', 'común'],
    sentence: 'Es importante beber ocho vasos de _____ al día.',
    opposite: '',
    synonyms: ['líquido', 'H₂O']
  },
  {
    id: 'es-food-004',
    word: 'manzana',
    category: 'food',
    language: 'es',
    image_url: '/images/words/manzana.webp',
    definition: 'Fruta redonda de piel roja, verde o amarilla.',
    features: {
      category: 'fruta',
      function: 'alimentarse, postre',
      location: 'frutero, mercado, árbol',
      properties: 'es redonda, crujiente, dulce o ácida',
      associations: 'fruta, árbol, piel, sidra'
    },
    phonetic: { first_sound: '/m/', syllables: 3, rhyming_word: 'gavana', first_phonemes: '/ma/' },
    difficulty: 1,
    tags: ['fruta', 'común'],
    sentence: 'Me como una _____ verde como merienda.',
    opposite: '',
    synonyms: ['fruta', 'pomo']
  },
  {
    id: 'es-food-005',
    word: 'naranja',
    category: 'food',
    language: 'es',
    image_url: '/images/words/naranja.webp',
    definition: 'Fruta cítrica redonda de color anaranjado.',
    features: {
      category: 'fruta',
      function: 'alimentarse, hacer zumo',
      location: 'frutero, mercado, árbol',
      properties: 'es redonda, cítrica, jugosa',
      associations: 'zumo, vitamina C, cítrico, jugo'
    },
    phonetic: { first_sound: '/n/', syllables: 3, rhyming_word: 'lanza', first_phonemes: '/na/' },
    difficulty: 1,
    tags: ['fruta', 'cítrico', 'común'],
    sentence: 'Me gusta beber zumo de _____ en el desayuno.',
    opposite: '',
    synonyms: ['cítrico', 'china']
  },
  {
    id: 'es-food-006',
    word: 'plátano',
    category: 'food',
    language: 'es',
    image_url: '/images/words/platano.webp',
    definition: 'Fruta alargada de color amarillo con piel gruesa.',
    features: {
      category: 'fruta',
      function: 'alimentarse, postre',
      location: 'frutero, mercado, planta tropical',
      properties: 'es alargado, amarillo, dulce',
      associations: 'mono, tropical, piel, potasio'
    },
    phonetic: { first_sound: '/p/', syllables: 3, rhyming_word: 'garrapato', first_phonemes: '/pla/' },
    difficulty: 1,
    tags: ['fruta', 'tropical', 'común'],
    sentence: 'El _____ está maduro cuando la piel se pone amarilla.',
    opposite: '',
    synonyms: ['banana', 'guineo']
  },
  {
    id: 'es-food-007',
    word: 'arroz',
    category: 'food',
    language: 'es',
    image_url: '/images/words/arroz.webp',
    definition: 'Cereal de grano pequeño que se cocina en agua.',
    features: {
      category: 'cereal',
      function: 'alimentarse, guarnición',
      location: 'cocina, supermercado, despensa',
      properties: 'es un grano pequeño, blanco, se cocina hirviendo',
      associations: 'paella, cereal, grano, cocina'
    },
    phonetic: { first_sound: '/a/', syllables: 2, rhyming_word: 'hoz', first_phonemes: '/a/' },
    difficulty: 1,
    tags: ['cereal', 'básico', 'común'],
    sentence: 'Voy a preparar una paella con _____ y azafrán.',
    opposite: '',
    synonyms: ['cereal']
  },
  {
    id: 'es-food-008',
    word: 'pollo',
    category: 'food',
    language: 'es',
    image_url: '/images/words/pollo.webp',
    definition: 'Carne de ave consumida en muchas preparaciones culinarias.',
    features: {
      category: 'carne',
      function: 'alimentarse',
      location: 'carnicería, supermercado, cocina',
      properties: 'carne blanca, tierna, versátil',
      associations: 'ave, asado, muslo, pechuga'
    },
    phonetic: { first_sound: '/p/', syllables: 2, rhyming_word: 'rollo', first_phonemes: '/po/' },
    difficulty: 1,
    tags: ['carne', 'común'],
    sentence: 'Hoy cocinaré _____ al horno con patatas.',
    opposite: '',
    synonyms: ['ave', 'gallina']
  },
  {
    id: 'es-food-009',
    word: 'huevo',
    category: 'food',
    language: 'es',
    image_url: '/images/words/huevo.webp',
    definition: 'Cuerpo ovalado puesto por las aves, muy nutritivo.',
    features: {
      category: 'alimento proteico',
      function: 'alimentarse, cocinar',
      location: 'nevera, cocina, supermercado',
      properties: 'es ovalado, tiene cáscara frágil, yema y clara',
      associations: 'gallina, tortilla, yema, clara'
    },
    phonetic: { first_sound: '/w/', syllables: 2, rhyming_word: 'nuevo', first_phonemes: '/we/' },
    difficulty: 1,
    tags: ['proteína', 'básico', 'común'],
    sentence: 'Me preparé un _____ frito para el desayuno.',
    opposite: '',
    synonyms: ['ovo']
  },
  {
    id: 'es-food-010',
    word: 'tomate',
    category: 'food',
    language: 'es',
    image_url: '/images/words/tomate.webp',
    definition: 'Fruto rojo y jugoso usado extensamente en cocina.',
    features: {
      category: 'verdura, fruto',
      function: 'cocinar, ensalada, salsa',
      location: 'cocina, mercado, huerto',
      properties: 'es rojo, jugoso, ligeramente ácido',
      associations: 'ensalada, salsa, rojo, huerto'
    },
    phonetic: { first_sound: '/t/', syllables: 3, rhyming_word: 'bate', first_phonemes: '/to/' },
    difficulty: 1,
    tags: ['verdura', 'común'],
    sentence: 'Corté un _____ fresco para la ensalada.',
    opposite: '',
    synonyms: ['jitomate', 'tomatera']
  },
  {
    id: 'es-food-011',
    word: 'queso',
    category: 'food',
    language: 'es',
    image_url: '/images/words/queso.webp',
    definition: 'Alimento lácteo sólido obtenido por la maduración de la cuajada.',
    features: {
      category: 'lácteo',
      function: 'alimentarse, acompañar',
      location: 'nevera, supermercado, quesería',
      properties: 'puede ser blando o duro, de sabor suave o fuerte',
      associations: 'leche, ratón, sandwich, tabla'
    },
    phonetic: { first_sound: '/k/', syllables: 2, rhyming_word: 'peso', first_phonemes: '/ke/' },
    difficulty: 1,
    tags: ['lácteo', 'común'],
    sentence: 'El _____ manchego es típico de España.',
    opposite: '',
    synonyms: ['lácteo', 'formaje']
  },
  {
    id: 'es-food-012',
    word: 'jamón',
    category: 'food',
    language: 'es',
    image_url: '/images/words/jamon.webp',
    definition: 'Carne de cerdo curada, típica de España.',
    features: {
      category: 'carne curada',
      function: 'alimentarse, aperitivo',
      location: 'cocina, supermercado, bodega',
      properties: 'es salado, curado, se sirve en lonchas finas',
      associations: 'cerdo, Ibérico, sandwich, tabla'
    },
    phonetic: { first_sound: '/x/', syllables: 2, rhyming_word: 'namón', first_phonemes: '/xa/' },
    difficulty: 2,
    tags: ['carne', 'español', 'común'],
    sentence: 'El _____ ibérico es un producto muy apreciado.',
    opposite: '',
    synonyms: ['jamón curado', 'presunto']
  },
  {
    id: 'es-food-013',
    word: 'ensalada',
    category: 'food',
    language: 'es',
    image_url: '/images/words/ensalada.webp',
    definition: 'Plato de verduras crudas mezcladas con aderezo.',
    features: {
      category: 'plato',
      function: 'alimentarse, entrante',
      location: 'mesa, restaurante, cocina',
      properties: 'es fresca, ligera, variada',
      associations: 'lechuga, tomate, vinagre, aceite'
    },
    phonetic: { first_sound: '/e/', syllables: 4, rhyming_word: 'moralada', first_phonemes: '/e/' },
    difficulty: 2,
    tags: ['plato', 'saludable', 'común'],
    sentence: 'Preparé una _____ con lechuga, tomate y pepino.',
    opposite: '',
    synonyms: ['mixto', 'salpicón']
  },
  {
    id: 'es-food-014',
    word: 'sopa',
    category: 'food',
    language: 'es',
    image_url: '/images/words/sopa.webp',
    definition: 'Plato líquido hecho con caldo y diversos ingredientes.',
    features: {
      category: 'plato',
      function: 'alimentarse, entrante',
      location: 'mesa, cocina, restaurante',
      properties: 'es caliente, líquida, reconfortante',
      associations: 'caldo, cuchara, caliente, cocido'
    },
    phonetic: { first_sound: '/s/', syllables: 2, rhyming_word: 'ropa', first_phonemes: '/so/' },
    difficulty: 1,
    tags: ['plato', 'caliente', 'común'],
    sentence: 'Cuando hace frío me gusta tomar _____ caliente.',
    opposite: '',
    synonyms: ['caldo', 'consomé']
  },
  {
    id: 'es-food-015',
    word: 'patata',
    category: 'food',
    language: 'es',
    image_url: '/images/words/patata.webp',
    definition: 'Tubérculo comestible de piel marrón y interior blanco.',
    features: {
      category: 'tubérculo',
      function: 'alimentarse, guarnición',
      location: 'cocina, supermercado, despensa',
      properties: 'es redondeada, de piel marrón, interior blanco',
      associations: 'tortilla, frita, puré, cocina'
    },
    phonetic: { first_sound: '/p/', syllables: 3, rhyming_word: 'pata', first_phonemes: '/pa/' },
    difficulty: 1,
    tags: ['tubérculo', 'básico', 'común'],
    sentence: 'La tortilla de _____ es un plato típico español.',
    opposite: '',
    synonyms: ['papa', 'patata']
  },
  {
    id: 'es-food-016',
    word: 'cebolla',
    category: 'food',
    language: 'es',
    image_url: '/images/words/cebolla.webp',
    definition: 'Bulbo comestible de sabor fuerte que hace llorar al cortar.',
    features: {
      category: 'verdura, bulbo',
      function: 'condimentar, cocinar',
      location: 'cocina, mercado, despensa',
      properties: 'es redondeada, tiene capas, hace llorar',
      associations: 'llorar, sofrito, cocina, ajo'
    },
    phonetic: { first_sound: '/θ/', syllables: 3, rhyming_word: 'bolla', first_phonemes: '/θe/' },
    difficulty: 2,
    tags: ['verdura', 'condimento', 'común'],
    sentence: 'Picó la _____ para el sofrito de la paella.',
    opposite: '',
    synonyms: ['cebolleta', 'allo']
  },
  {
    id: 'es-food-017',
    word: 'ajo',
    category: 'food',
    language: 'es',
    image_url: '/images/words/ajo.webp',
    definition: 'Planta con bulbo de sabor intenso y aromático.',
    features: {
      category: 'condimento, bulbo',
      function: 'condimentar, cocinar',
      location: 'cocina, mercado, despensa',
      properties: 'tiene dientes, olor fuerte, sabor intenso',
      associations: 'cebolla, sofrito, vampires, cocina'
    },
    phonetic: { first_sound: '/a/', syllables: 2, rhyming_word: 'ro', first_phonemes: '/a/' },
    difficulty: 1,
    tags: ['condimento', 'común'],
    sentence: 'Añadí dos dientes de _____ a la salsa.',
    opposite: '',
    synonyms: ['ajete']
  },
  {
    id: 'es-food-018',
    word: 'zanahoria',
    category: 'food',
    language: 'es',
    image_url: '/images/words/zanahoria.webp',
    definition: 'Hortaliza alargada de color naranja y sabor dulce.',
    features: {
      category: 'hortaliza',
      function: 'alimentarse, cocinar',
      location: 'cocina, mercado, huerto',
      properties: 'es alargada, naranja, crujiente',
      associations: 'conejo, naranja, cruda, cocina'
    },
    phonetic: { first_sound: '/θ/', syllables: 4, rhyming_word: 'gloria', first_phonemes: '/θa/' },
    difficulty: 2,
    tags: ['hortaliza', 'común'],
    sentence: 'El conejo come _____ cruda del huerto.',
    opposite: '',
    synonyms: ['raíz']
  },
  {
    id: 'es-food-019',
    word: 'lechuga',
    category: 'food',
    language: 'es',
    image_url: '/images/words/lechuga.webp',
    definition: 'Planta de hojas verdes comestibles usada en ensaladas.',
    features: {
      category: 'hortaliza',
      function: 'ensalada, alimentarse',
      location: 'huerto, mercado, nevera',
      properties: 'tiene hojas verdes, es fresca, crujiente',
      associations: 'ensalada, verde, hojas, huerto'
    },
    phonetic: { first_sound: '/l/', syllables: 3, rhyming_word: 'bicha', first_phonemes: '/le/' },
    difficulty: 2,
    tags: ['hortaliza', 'verde', 'común'],
    sentence: 'Lavé la _____ para preparar la ensalada.',
    opposite: '',
    synonyms: ['escarola', 'achicoria']
  },
  {
    id: 'es-food-020',
    word: 'uva',
    category: 'food',
    language: 'es',
    image_url: '/images/words/uva.webp',
    definition: 'Fruta pequeña y redonda que crece en racimos.',
    features: {
      category: 'fruta',
      function: 'alimentarse, hacer vino',
      location: 'viñedo, mercado, frutero',
      properties: 'es pequeña, redonda, puede ser verde o morada',
      associations: 'vino, racimo, viñedo, Año Nuevo'
    },
    phonetic: { first_sound: '/u/', syllables: 2, rhyming_word: 'uba', first_phonemes: '/u/' },
    difficulty: 1,
    tags: ['fruta', 'común'],
    sentence: 'Las _____ son el ingrediente principal del vino.',
    opposite: '',
    synonyms: ['baya']
  },
  {
    id: 'es-food-021',
    word: 'fresa',
    category: 'food',
    language: 'es',
    image_url: '/images/words/fresa.webp',
    definition: 'Fruta roja pequeña y dulce con semillas en la superficie.',
    features: {
      category: 'fruta',
      function: 'alimentarse, postre',
      location: 'campo, mercado, frutero',
      properties: 'es roja, pequeña, dulce, con semillas',
      associations: 'postre, nata, mermelada, rojo'
    },
    phonetic: { first_sound: '/f/', syllables: 2, rhyming_word: 'pesa', first_phonemes: '/fre/' },
    difficulty: 2,
    tags: ['fruta', 'común'],
    sentence: 'Las _____ con nata son un postre delicioso.',
    opposite: '',
    synonyms: ['frutilla', 'fresón']
  },
  {
    id: 'es-food-022',
    word: 'limón',
    category: 'food',
    language: 'es',
    image_url: '/images/words/limon.webp',
    definition: 'Fruto cítrico amarillo de sabor muy ácido.',
    features: {
      category: 'fruta cítrica',
      function: 'condimentar, bebida',
      location: 'árbol, mercado, cocina',
      properties: 'es amarillo, ácido, ovalado',
      associations: 'ácido, naranja, cítrico, refresco'
    },
    phonetic: { first_sound: '/l/', syllables: 2, rhyming_word: 'dimón', first_phonemes: '/li/' },
    difficulty: 1,
    tags: ['fruta', 'cítrico', 'común'],
    sentence: 'Exprimí un _____ para hacer limonada.',
    opposite: '',
    synonyms: ['cítrico', 'agrio']
  },
  {
    id: 'es-food-023',
    word: 'café',
    category: 'food',
    language: 'es',
    image_url: '/images/words/cafe.webp',
    definition: 'Bebida oscura y estimulante hecha de granos tostados.',
    features: {
      category: 'bebida',
      function: 'estimular, despertar',
      location: 'cafetería, cocina, oficina',
      properties: 'es oscuro, amargo, aromático, caliente',
      associations: 'desayuno, taza, leche, cafeína'
    },
    phonetic: { first_sound: '/k/', syllables: 2, rhyming_word: 'té', first_phonemes: '/ka/' },
    difficulty: 1,
    tags: ['bebida', 'estimulante', 'común'],
    sentence: 'Me tomo un _____ con leche cada mañana.',
    opposite: '',
    synonyms: ['expreso', 'tinto']
  },
  {
    id: 'es-food-024',
    word: 'azúcar',
    category: 'food',
    language: 'es',
    image_url: '/images/words/azucar.webp',
    definition: 'Sustancia dulce en forma de cristales blancos.',
    features: {
      category: 'condimento',
      function: 'endulzar',
      location: 'cocina, supermercado, despensa',
      properties: 'es blanca, dulce, cristalina',
      associations: 'dulce, café, postre, miel'
    },
    phonetic: { first_sound: '/a/', syllables: 2, rhyming_word: 'agá', first_phonemes: '/a/' },
    difficulty: 2,
    tags: ['condimento', 'dulce', 'común'],
    sentence: 'Le pongo una cucharada de _____ al café.',
    opposite: '',
    synonyms: ['sacarosa', 'endulzante']
  },
  {
    id: 'es-food-025',
    word: 'sal',
    category: 'food',
    language: 'es',
    image_url: '/images/words/sal.webp',
    definition: 'Sustancia cristalina usada para dar sabor a las comidas.',
    features: {
      category: 'condimento',
      function: 'sazonar',
      location: 'cocina, mesa, supermercado',
      properties: 'es blanca, cristalina, salada',
      associations: 'pimienta, mar, cocina, salero'
    },
    phonetic: { first_sound: '/s/', syllables: 1, rhyming_word: 'tal', first_phonemes: '/sa/' },
    difficulty: 1,
    tags: ['condimento', 'básico', 'común'],
    sentence: 'Echa una pizca de _____ a la sopa.',
    opposite: '',
    synonyms: ['cloruro de sodio', 'salmuera']
  },

  // ==========================================
  // HOUSEHOLD (15 words)
  // ==========================================
  {
    id: 'es-household-001',
    word: 'mesa',
    category: 'household',
    language: 'es',
    image_url: '/images/words/mesa.webp',
    definition: 'Mueble con superficie plana sostenida por patas.',
    features: {
      category: 'mueble',
      function: 'apoyar objetos, comer, trabajar',
      location: 'comedor, cocina, salón',
      properties: 'tiene superficie plana y patas',
      associations: 'silla, mantel, comedor, plato'
    },
    phonetic: { first_sound: '/m/', syllables: 2, rhyming_word: 'pesa', first_phonemes: '/me/' },
    difficulty: 1,
    tags: ['mueble', 'común'],
    sentence: 'Puse los platos sobre la _____ del comedor.',
    opposite: '',
    synonyms: ['tablero', 'mesada']
  },
  {
    id: 'es-household-002',
    word: 'silla',
    category: 'household',
    language: 'es',
    image_url: '/images/words/silla.webp',
    definition: 'Asiento con respaldo para una persona.',
    features: {
      category: 'mueble',
      function: 'sentarse',
      location: 'comedor, cocina, salón',
      properties: 'tiene asiento y respaldo, cuatro patas',
      associations: 'mesa, asiento, respaldo, comedor'
    },
    phonetic: { first_sound: '/s/', syllables: 2, rhyming_word: 'silla', first_phonemes: '/si/' },
    difficulty: 1,
    tags: ['mueble', 'común'],
    sentence: 'Siéntate en la _____ junto a la ventana.',
    opposite: '',
    synonyms: ['asiento', 'sillón']
  },
  {
    id: 'es-household-003',
    word: 'cama',
    category: 'household',
    language: 'es',
    image_url: '/images/words/cama.webp',
    definition: 'Mueble para dormir o descansar.',
    features: {
      category: 'mueble',
      function: 'dormir, descansar',
      location: 'dormitorio, habitación',
      properties: 'tiene colchón, almohada, sábanas',
      associations: 'dormir, almohada, sábana, dormitorio'
    },
    phonetic: { first_sound: '/k/', syllables: 2, rhyming_word: 'ama', first_phonemes: '/ka/' },
    difficulty: 1,
    tags: ['mueble', 'común'],
    sentence: 'Me acuesto en la _____ a las diez de la noche.',
    opposite: '',
    synonyms: ['lecho', 'catre']
  },
  {
    id: 'es-household-004',
    word: 'puerta',
    category: 'household',
    language: 'es',
    image_url: '/images/words/puerta.webp',
    definition: 'Lámina de madera o metal que cierra una entrada.',
    features: {
      category: 'estructura',
      function: 'abrir y cerrar paso',
      location: 'pared, entrada, casa',
      properties: 'tiene bisagras, pomo, se abre y cierra',
      associations: 'llave, pomo, bisagra, entrada'
    },
    phonetic: { first_sound: '/p/', syllables: 2, rhyming_word: 'fuerta', first_phonemes: '/pwe/' },
    difficulty: 1,
    tags: ['estructura', 'común'],
    sentence: 'Cierra la _____ al salir de casa.',
    opposite: '',
    synonyms: ['portal', 'acceso']
  },
  {
    id: 'es-household-005',
    word: 'ventana',
    category: 'household',
    language: 'es',
    image_url: '/images/words/ventana.webp',
    definition: 'Abertura en la pared con cristal para dejar pasar luz.',
    features: {
      category: 'estructura',
      function: 'iluminar, ventilar',
      location: 'pared, habitación',
      properties: 'tiene cristal, marco, se puede abrir',
      associations: 'cristal, cortina, luz, aire'
    },
    phonetic: { first_sound: '/b/', syllables: 3, rhyming_word: 'campana', first_phonemes: '/be/' },
    difficulty: 1,
    tags: ['estructura', 'común'],
    sentence: 'Abre la _____ para que entre aire fresco.',
    opposite: '',
    synonyms: ['claraboya', 'ventanal']
  },
  {
    id: 'es-household-006',
    word: 'cocina',
    category: 'household',
    language: 'es',
    image_url: '/images/words/cocina.webp',
    definition: 'Habitación donde se preparan los alimentos.',
    features: {
      category: 'habitación',
      function: 'cocinar, preparar comida',
      location: 'casa, apartamento, restaurante',
      properties: 'tiene fogones, horno, fregadero',
      associations: 'fuego, comida, olla, nevera'
    },
    phonetic: { first_sound: '/k/', syllables: 3, rhyming_word: 'vecina', first_phonemes: '/ko/' },
    difficulty: 1,
    tags: ['habitación', 'común'],
    sentence: 'La _____ de mi casa tiene una ventana grande.',
    opposite: '',
    synonyms: ['fogón', 'fogones']
  },
  {
    id: 'es-household-007',
    word: 'baño',
    category: 'household',
    language: 'es',
    image_url: '/images/words/bano.webp',
    definition: 'Habitación con instalaciones para la higiene personal.',
    features: {
      category: 'habitación',
      function: 'aseo, higiene',
      location: 'casa, hotel, restaurante',
      properties: 'tiene inodoro, lavabo, ducha o bañera',
      associations: 'agua, jabón, ducha, toalla'
    },
    phonetic: { first_sound: '/b/', syllables: 2, rhyming_word: 'año', first_phonemes: '/ba/' },
    difficulty: 1,
    tags: ['habitación', 'común'],
    sentence: 'El _____ está al fondo del pasillo.',
    opposite: '',
    synonyms: ['aseo', 'lavabo']
  },
  {
    id: 'es-household-008',
    word: 'escalera',
    category: 'household',
    language: 'es',
    image_url: '/images/words/escalera.webp',
    definition: 'Serie de peldaños que conectan diferentes niveles.',
    features: {
      category: 'estructura',
      function: 'subir y bajar entre pisos',
      location: 'casa, edificio, exterior',
      properties: 'tiene peldaños, pasamanos',
      associations: 'peldaños, subir, bajar, pasamanos'
    },
    phonetic: { first_sound: '/e/', syllables: 4, rhyming_word: 'bandera', first_phonemes: '/es/' },
    difficulty: 2,
    tags: ['estructura', 'común'],
    sentence: 'Sube la _____ con cuidado de no tropezar.',
    opposite: '',
    synonyms: ['gradas', 'peldaños']
  },
  {
    id: 'es-household-009',
    word: 'espejo',
    category: 'household',
    language: 'es',
    image_url: '/images/words/espejo.webp',
    definition: 'Superficie lisa que refleja la imagen de lo que tiene delante.',
    features: {
      category: 'objeto decorativo',
      function: 'reflejar imagen',
      location: 'baño, dormitorio, pasillo',
      properties: 'es de cristal, refleja, frágil',
      associations: 'reflejo, cristal, imagen, baño'
    },
    phonetic: { first_sound: '/e/', syllables: 3, rhyming_word: 'consejo', first_phonemes: '/es/' },
    difficulty: 2,
    tags: ['decoración', 'común'],
    sentence: 'Me miro en el _____ por la mañana para peinarme.',
    opposite: '',
    synonyms: ['azogue', 'espejuelo']
  },
  {
    id: 'es-household-010',
    word: 'alfombra',
    category: 'household',
    language: 'es',
    image_url: '/images/words/alfombra.webp',
    definition: 'Tela gruesa que cubre el suelo.',
    features: {
      category: 'textil',
      function: 'decorar, cubrir suelo',
      location: 'salón, dormitorio, pasillo',
      properties: 'es de tela, suave, decorativa',
      associations: 'suelo, moqueta, decoración, tejido'
    },
    phonetic: { first_sound: '/a/', syllables: 3, rhyming_word: 'sombra', first_phonemes: '/al/' },
    difficulty: 3,
    tags: ['textil', 'decoración'],
    sentence: 'La nueva _____ del salón combina con las cortinas.',
    opposite: '',
    synonyms: ['moqueta', 'tapete']
  },
  {
    id: 'es-household-011',
    word: 'sofá',
    category: 'household',
    language: 'es',
    image_url: '/images/words/sofa.webp',
    definition: 'Asiento largo y acolchado para varias personas.',
    features: {
      category: 'mueble',
      function: 'sentarse, descansar',
      location: 'salón, living, habitación',
      properties: 'es acolchado, largo, cómodo',
      associations: 'cojín, salón, televisión, descanso'
    },
    phonetic: { first_sound: '/s/', syllables: 2, rhyming_word: 'sofá', first_phonemes: '/so/' },
    difficulty: 1,
    tags: ['mueble', 'común'],
    sentence: 'Me siento en el _____ a ver la televisión.',
    opposite: '',
    synonyms: ['sillón', 'canapé']
  },
  {
    id: 'es-household-012',
    word: 'estantería',
    category: 'household',
    language: 'es',
    image_url: '/images/words/estanteria.webp',
    definition: 'Mueble con baldas para colocar objetos.',
    features: {
      category: 'mueble',
      function: 'almacenar, decorar',
      location: 'salón, estudio, oficina',
      properties: 'tiene baldas o estantes, vertical',
      associations: 'libro, balda, biblioteca, orden'
    },
    phonetic: { first_sound: '/e/', syllables: 5, rhyming_word: 'teoría', first_phonemes: '/es/' },
    difficulty: 4,
    tags: ['mueble', 'almacenaje'],
    sentence: 'Los libros están ordenados en la _____ del salón.',
    opposite: '',
    synonyms: ['baldas', 'librero']
  },
  {
    id: 'es-household-013',
    word: 'nevera',
    category: 'household',
    language: 'es',
    image_url: '/images/words/nevera.webp',
    definition: 'Electrodoméstico que mantiene los alimentos fríos.',
    features: {
      category: 'electrodoméstico',
      function: 'conservar alimentos en frío',
      location: 'cocina',
      properties: 'es grande, mantiene frío, tiene puertas',
      associations: 'frío, comida, cocina, hielo'
    },
    phonetic: { first_sound: '/n/', syllables: 3, rhyming_word: 'clevera', first_phonemes: '/ne/' },
    difficulty: 2,
    tags: ['electrodoméstico', 'común'],
    sentence: 'Guarda la leche en la _____ para que no se ponga mala.',
    opposite: '',
    synonyms: ['refrigerador', 'frigorífico']
  },
  {
    id: 'es-household-014',
    word: 'lavadora',
    category: 'household',
    language: 'es',
    image_url: '/images/words/lavadora.webp',
    definition: 'Electrodoméstico para lavar la ropa.',
    features: {
      category: 'electrodoméstico',
      function: 'lavar ropa',
      location: 'lavadero, baño, cocina',
      properties: 'es grande, gira, usa agua y jabón',
      associations: 'ropa, jabón, agua, centrifugado'
    },
    phonetic: { first_sound: '/l/', syllables: 4, rhyming_word: 'dora', first_phonemes: '/la/' },
    difficulty: 3,
    tags: ['electrodoméstico', 'común'],
    sentence: 'Puse la ropa sucia en la _____ y la puse en marcha.',
    opposite: '',
    synonyms: ['máquina de lavar']
  },
  {
    id: 'es-household-015',
    word: 'microondas',
    category: 'household',
    language: 'es',
    image_url: '/images/words/microondas.webp',
    definition: 'Electrodoméstico que calienta la comida rápidamente.',
    features: {
      category: 'electrodoméstico',
      function: 'calentar comida',
      location: 'cocina',
      properties: 'es pequeño, calienta rápido, tiene botones',
      associations: 'calentar, cocina, plato, tiempo'
    },
    phonetic: { first_sound: '/m/', syllables: 4, rhyming_word: 'ondas', first_phonemes: '/mi/' },
    difficulty: 4,
    tags: ['electrodoméstico', 'común'],
    sentence: 'Calienta la sopa en el _____ durante dos minutos.',
    opposite: '',
    synonyms: ['horno microondas']
  },

  // ==========================================
  // BODY PARTS (15 words)
  // ==========================================
  {
    id: 'es-body-001',
    word: 'cabeza',
    category: 'body-parts',
    language: 'es',
    image_url: '/images/words/cabeza.webp',
    definition: 'Parte superior del cuerpo que contiene el cerebro.',
    features: {
      category: 'parte del cuerpo',
      function: 'pensar, ver, oír, oler, hablar',
      location: 'parte superior del cuerpo',
      properties: 'contiene cerebro, ojos, nariz, boca, orejas',
      associations: 'cerebro, cara, pelo, cuello'
    },
    phonetic: { first_sound: '/k/', syllables: 3, rhyming_word: 'pieza', first_phonemes: '/ka/' },
    difficulty: 1,
    tags: ['cuerpo', 'común'],
    sentence: 'Me duele la _____ después de estudiar tanto.',
    opposite: '',
    synonyms: ['cabeza', 'cráneo']
  },
  {
    id: 'es-body-002',
    word: 'mano',
    category: 'body-parts',
    language: 'es',
    image_url: '/images/words/mano.webp',
    definition: 'Extremidad del brazo con cinco dedos.',
    features: {
      category: 'parte del cuerpo',
      function: 'agarrar, tocar, escribir',
      location: 'extremo del brazo',
      properties: 'tiene cinco dedos, palma, dorso',
      associations: 'dedo, brazo, palma, puño'
    },
    phonetic: { first_sound: '/m/', syllables: 2, rhyming_word: 'zano', first_phonemes: '/ma/' },
    difficulty: 1,
    tags: ['cuerpo', 'común'],
    sentence: 'Me lavé las _____ antes de comer.',
    opposite: '',
    synonyms: ['extremidad', 'garra']
  },
  {
    id: 'es-body-003',
    word: 'pie',
    category: 'body-parts',
    language: 'es',
    image_url: '/images/words/pie.webp',
    definition: 'Parte final de la pierna que sirve para caminar.',
    features: {
      category: 'parte del cuerpo',
      function: 'caminar, mantener el equilibrio',
      location: 'extremo de la pierna',
      properties: 'tiene dedos, talón, empeine',
      associations: 'zapato, calcetín, caminar, tobillo'
    },
    phonetic: { first_sound: '/p/', syllables: 1, rhyming_word: 'pie', first_phonemes: '/pie/' },
    difficulty: 1,
    tags: ['cuerpo', 'común'],
    sentence: 'Me quité los zapatos porque me dolía el _____.',
    opposite: '',
    synonyms: ['extremidad', 'planta']
  },
  {
    id: 'es-body-004',
    word: 'ojo',
    category: 'body-parts',
    language: 'es',
    image_url: '/images/words/ojo.webp',
    definition: 'Órgano de la vista situado en la cara.',
    features: {
      category: 'órgano sensorial',
      function: 'ver',
      location: 'cara, rostro',
      properties: 'tiene pupila, iris, párpado, pestañas',
      associations: 'ver, mirar, lágrima, gafas'
    },
    phonetic: { first_sound: '/o/', syllables: 2, rhyming_word: 'rojo', first_phonemes: '/o/' },
    difficulty: 1,
    tags: ['cuerpo', 'sentido', 'común'],
    sentence: 'Se frotó el _____ porque le picaba.',
    opposite: '',
    synonyms: ['globo ocular', 'pupila']
  },
  {
    id: 'es-body-005',
    word: 'boca',
    category: 'body-parts',
    language: 'es',
    image_url: '/images/words/boca.webp',
    definition: 'Abertura de la cara por donde se come y habla.',
    features: {
      category: 'parte del cuerpo',
      function: 'comer, hablar, respirar',
      location: 'parte inferior de la cara',
      properties: 'tiene labios, dientes, lengua',
      associations: 'diente, lengua, labio, sonrisa'
    },
    phonetic: { first_sound: '/b/', syllables: 2, rhyming_word: 'poca', first_phonemes: '/bo/' },
    difficulty: 1,
    tags: ['cuerpo', 'común'],
    sentence: 'Abre la _____ para decir "ah".',
    opposite: '',
    synonyms: ['labio', 'fauces']
  },
  {
    id: 'es-body-006',
    word: 'nariz',
    category: 'body-parts',
    language: 'es',
    image_url: '/images/words/nariz.webp',
    definition: 'Órgano olfativo que sobresale en el centro de la cara.',
    features: {
      category: 'órgano sensorial',
      function: 'oler, respirar',
      location: 'centro de la cara',
      properties: 'tiene fosas nasales, cartílago',
      associations: 'oler, estornudardo, pañuelo, respirar'
    },
    phonetic: { first_sound: '/n/', syllables: 2, rhyming_word: 'tapiz', first_phonemes: '/na/' },
    difficulty: 1,
    tags: ['cuerpo', 'sentido', 'común'],
    sentence: 'Se sonó la _____ con un pañuelo.',
    opposite: '',
    synonyms: ['apéndice nasal', 'fosa']
  },
  {
    id: 'es-body-007',
    word: 'oreja',
    category: 'body-parts',
    language: 'es',
    image_url: '/images/words/oreja.webp',
    definition: 'Órgano auditivo a los lados de la cabeza.',
    features: {
      category: 'órgano sensorial',
      function: 'oír, escuchar',
      location: 'a ambos lados de la cabeza',
      properties: 'tiene lóbulo, cartílago, forma curva',
      associations: 'oír, escuchar, pendiente, sonido'
    },
    phonetic: { first_sound: '/o/', syllables: 3, rhyming_word: 'abeja', first_phonemes: '/o/' },
    difficulty: 2,
    tags: ['cuerpo', 'sentido', 'común'],
    sentence: 'Me picó un mosquito en la _____.',
    opposite: '',
    synonyms: ['pabellón auditivo', 'oído']
  },
  {
    id: 'es-body-008',
    word: 'dedo',
    category: 'body-parts',
    language: 'es',
    image_url: '/images/words/dedo.webp',
    definition: 'Cada una de las extremidades articuladas de manos y pies.',
    features: {
      category: 'parte del cuerpo',
      function: 'agarrar, señalar',
      location: 'manos, pies',
      properties: 'es largo, articulado, tiene uña',
      associations: 'mano, pie, uña, anillo'
    },
    phonetic: { first_sound: '/d/', syllables: 2, rhyming_word: 'redo', first_phonemes: '/de/' },
    difficulty: 1,
    tags: ['cuerpo', 'común'],
    sentence: 'Se golpeó el _____ con el martillo.',
    opposite: '',
    synonyms: ['falange']
  },
  {
    id: 'es-body-009',
    word: 'brazo',
    category: 'body-parts',
    language: 'es',
    image_url: '/images/words/brazo.webp',
    definition: 'Extremidad superior del cuerpo desde el hombro a la mano.',
    features: {
      category: 'parte del cuerpo',
      function: 'mover, agarrar, abrazar',
      location: 'extremidad superior',
      properties: 'tiene hombro, codo, antebrazo',
      associations: 'mano, hombro, codo, muñeca'
    },
    phonetic: { first_sound: '/b/', syllables: 2, rhyming_word: 'paso', first_phonemes: '/bra/' },
    difficulty: 1,
    tags: ['cuerpo', 'común'],
    sentence: 'Le dolía el _____ después de levantar las cajas.',
    opposite: '',
    synonyms: ['extremidad superior']
  },
  {
    id: 'es-body-010',
    word: 'pierna',
    category: 'body-parts',
    language: 'es',
    image_url: '/images/words/pierna.webp',
    definition: 'Extremidad inferior del cuerpo desde la cadera al pie.',
    features: {
      category: 'parte del cuerpo',
      function: 'caminar, correr, saltar',
      location: 'extremidad inferior',
      properties: 'tiene muslo, rodilla, pantorrilla',
      associations: 'pie, rodilla, muslo, pantorrilla'
    },
    phonetic: { first_sound: '/p/', syllables: 2, rhyming_word: 'tierna', first_phonemes: '/pie/' },
    difficulty: 1,
    tags: ['cuerpo', 'común'],
    sentence: 'Se fracturó la _____ esquiando.',
    opposite: '',
    synonyms: ['extremidad inferior']
  },
  {
    id: 'es-body-011',
    word: 'rodilla',
    category: 'body-parts',
    language: 'es',
    image_url: '/images/words/rodilla.webp',
    definition: 'Articulación entre el muslo y la pierna.',
    features: {
      category: 'articulación',
      function: 'flexionar la pierna',
      location: 'parte media de la pierna',
      properties: 'es una articulación, se dobla',
      associations: 'pierna, flexión, muslo, rótula'
    },
    phonetic: { first_sound: '/r/', syllables: 3, rhyming_word: 'grilla', first_phonemes: '/ro/' },
    difficulty: 2,
    tags: ['cuerpo', 'articulación'],
    sentence: 'Se cayó y se lastimó la _____.',
    opposite: '',
    synonyms: ['rótula', 'articulación']
  },
  {
    id: 'es-body-012',
    word: 'hombro',
    category: 'body-parts',
    language: 'es',
    image_url: '/images/words/hombro.webp',
    definition: 'Articulación que une el brazo con el tronco.',
    features: {
      category: 'articulación',
      function: 'mover el brazo',
      location: 'parte superior del cuerpo',
      properties: 'es una articulación, une brazo y tronco',
      associations: 'brazo, espalda, cuello, carga'
    },
    phonetic: { first_sound: '/o/', syllables: 2, rhyming_word: 'hondo', first_phonemes: '/o/' },
    difficulty: 2,
    tags: ['cuerpo', 'articulación'],
    sentence: 'Llevaba la mochila sobre el _____.',
    opposite: '',
    synonyms: ['articulación glenohumeral']
  },
  {
    id: 'es-body-013',
    word: 'cuello',
    category: 'body-parts',
    language: 'es',
    image_url: '/images/words/cuello.webp',
    definition: 'Parte del cuerpo que une la cabeza con el tronco.',
    features: {
      category: 'parte del cuerpo',
      function: 'unir cabeza y tronco, girar',
      location: 'entre cabeza y tronco',
      properties: 'tiene vértebras, es flexible',
      associations: 'cabeza, garganta, corbata, collar'
    },
    phonetic: { first_sound: '/k/', syllables: 2, rhyming_word: 'pueblo', first_phonemes: '/ku/' },
    difficulty: 1,
    tags: ['cuerpo', 'común'],
    sentence: 'Se puso una bufanda alrededor del _____.',
    opposite: '',
    synonyms: ['garganta', 'cerviz']
  },
  {
    id: 'es-body-014',
    word: 'espalda',
    category: 'body-parts',
    language: 'es',
    image_url: '/images/words/espalda.webp',
    definition: 'Parte posterior del tronco humano.',
    features: {
      category: 'parte del cuerpo',
      function: 'sostener, cargar',
      location: 'parte posterior del tronco',
      properties: 'es ancha, tiene vértebras, músculos',
      associations: 'mochila, columna, músculo, dolor'
    },
    phonetic: { first_sound: '/e/', syllables: 3, rhyming_word: 'espada', first_phonemes: '/es/' },
    difficulty: 2,
    tags: ['cuerpo', 'común'],
    sentence: 'Me duele la _____ de tanto sentarme.',
    opposite: '',
    synonyms: ['lomo', 'dorso']
  },
  {
    id: 'es-body-015',
    word: 'pecho',
    category: 'body-parts',
    language: 'es',
    image_url: '/images/words/pecho.webp',
    definition: 'Parte anterior del tronco que contiene los pulmones y el corazón.',
    features: {
      category: 'parte del cuerpo',
      function: 'respirar, proteger órganos',
      location: 'parte anterior del tronco',
      properties: 'contiene corazón y pulmones',
      associations: 'corazón, respiración, pulmón, costilla'
    },
    phonetic: { first_sound: '/p/', syllables: 2, rhyming_word: 'lecho', first_phonemes: '/pe/' },
    difficulty: 1,
    tags: ['cuerpo', 'común'],
    sentence: 'Respira hondo y llena el _____ de aire.',
    opposite: '',
    synonyms: ['torax', 'tórax']
  },

  // ==========================================
  // CLOTHING (12 words)
  // ==========================================
  {
    id: 'es-clothing-001',
    word: 'camisa',
    category: 'clothing',
    language: 'es',
    image_url: '/images/words/camisa.webp',
    definition: 'Prenda de vestir que cubre el torso con mangas y cuello.',
    features: {
      category: 'prenda de vestir',
      function: 'vestir, abrigar',
      location: 'armario, tienda',
      properties: 'tiene mangas, botones, cuello',
      associations: 'pantalón, corbata, armario, formal'
    },
    phonetic: { first_sound: '/k/', syllables: 3, rhyming_word: 'risa', first_phonemes: '/ka/' },
    difficulty: 1,
    tags: ['ropa', 'común'],
    sentence: 'Se puso una _____ blanca para ir a la entrevista.',
    opposite: '',
    synonyms: ['blusa', 'camiseta']
  },
  {
    id: 'es-clothing-002',
    word: 'pantalón',
    category: 'clothing',
    language: 'es',
    image_url: '/images/words/pantalon.webp',
    definition: 'Prenda de vestir que cubre las piernas desde la cintura.',
    features: {
      category: 'prenda de vestir',
      function: 'vestir, cubrir piernas',
      location: 'armario, tienda',
      properties: 'tiene dos perneras, cintura, cremallera',
      associations: 'cinturón, pierna, bolsillo, vaquero'
    },
    phonetic: { first_sound: '/p/', syllables: 3, rhyming_word: 'balón', first_phonemes: '/pan/' },
    difficulty: 1,
    tags: ['ropa', 'común'],
    sentence: 'Compré un _____ nuevo para el trabajo.',
    opposite: '',
    synonyms: ['pantalones', 'vaquero']
  },
  {
    id: 'es-clothing-003',
    word: 'vestido',
    category: 'clothing',
    language: 'es',
    image_url: '/images/words/vestido.webp',
    definition: 'Prenda de vestir de una sola pieza que cubre el cuerpo.',
    features: {
      category: 'prenda de vestir',
      function: 'vestir, elegante',
      location: 'armario, tienda',
      properties: 'es de una pieza, cubre torso y piernas',
      associations: 'falda, elegante, fiesta, mujer'
    },
    phonetic: { first_sound: '/b/', syllables: 3, rhyming_word: 'perdido', first_phonemes: '/be/' },
    difficulty: 1,
    tags: ['ropa', 'común'],
    sentence: 'Se puso un _____ rojo para la fiesta.',
    opposite: '',
    synonyms: ['túnica', 'traje']
  },
  {
    id: 'es-clothing-004',
    word: 'zapato',
    category: 'clothing',
    language: 'es',
    image_url: '/images/words/zapato.webp',
    definition: 'Calzado que protege los pies.',
    features: {
      category: 'calzado',
      function: 'proteger los pies, caminar',
      location: 'zapatero, tienda',
      properties: 'tiene suela, empeine, tacón',
      associations: 'pie, calcetín, caminar, cordón'
    },
    phonetic: { first_sound: '/θ/', syllables: 3, rhyming_word: 'gato', first_phonemes: '/θa/' },
    difficulty: 1,
    tags: ['calzado', 'común'],
    sentence: 'Me compré un _____ nuevo de cuero.',
    opposite: '',
    synonyms: ['calzado', 'zapatilla']
  },
  {
    id: 'es-clothing-005',
    word: 'sombrero',
    category: 'clothing',
    language: 'es',
    image_url: '/images/words/sombrero.webp',
    definition: 'Prenda que cubre la cabeza para protección o adorno.',
    features: {
      category: 'accesorio',
      function: 'proteger del sol, abrigar',
      location: 'cabeza, armario',
      properties: 'tiene ala, copa, se pone en la cabeza',
      associations: 'cabeza, sol, ala, copa'
    },
    phonetic: { first_sound: '/s/', syllables: 3, rhyming_word: 'somero', first_phonemes: '/so/' },
    difficulty: 2,
    tags: ['accesorio', 'común'],
    sentence: 'Se puso el _____ para protegerse del sol.',
    opposite: '',
    synonyms: ['gorro', 'gorra']
  },
  {
    id: 'es-clothing-006',
    word: 'chaqueta',
    category: 'clothing',
    language: 'es',
    image_url: '/images/words/chaqueta.webp',
    definition: 'Prenda exterior con mangas que se abrocha adelante.',
    features: {
      category: 'prenda de vestir',
      function: 'abrigo, vestir',
      location: 'armario, percha',
      properties: 'tiene mangas, botones o cremallera',
      associations: 'abrigo, frío, manga, botón'
    },
    phonetic: { first_sound: '/tʃ/', syllables: 3, rhyming_word: 'meta', first_phonemes: '/tʃa/' },
    difficulty: 2,
    tags: ['ropa', 'abrigo'],
    sentence: 'Lleva una _____ de cuero muy elegante.',
    opposite: '',
    synonyms: ['americana', 'saco']
  },
  {
    id: 'es-clothing-007',
    word: 'guante',
    category: 'clothing',
    language: 'es',
    image_url: '/images/words/guante.webp',
    definition: 'Prenda que cubre las manos con compartimentos para los dedos.',
    features: {
      category: 'accesorio',
      function: 'proteger las manos del frío',
      location: 'armario, cajón',
      properties: 'cubre los dedos, viene en par',
      associations: 'mano, frío, invierno, dedo'
    },
    phonetic: { first_sound: '/g/', syllables: 2, rhyming_word: 'cuanto', first_phonemes: '/gwa/' },
    difficulty: 2,
    tags: ['accesorio', 'invierno'],
    sentence: 'Me pongo los _____ cuando hace mucho frío.',
    opposite: '',
    synonyms: ['manopla']
  },
  {
    id: 'es-clothing-008',
    word: 'bufanda',
    category: 'clothing',
    language: 'es',
    image_url: '/images/words/bufanda.webp',
    definition: 'Prenda de lana que se enrolla alrededor del cuello.',
    features: {
      category: 'accesorio',
      function: 'abrigo, protección del frío',
      location: 'armario, cuello',
      properties: 'es alargada, de lana, suave',
      associations: 'cuello, invierno, lana, frío'
    },
    phonetic: { first_sound: '/b/', syllables: 3, rhyming_word: 'anda', first_phonemes: '/bu/' },
    difficulty: 2,
    tags: ['accesorio', 'invierno'],
    sentence: 'Se enrolló la _____ alrededor del cuello.',
    opposite: '',
    synonyms: ['chal', 'pañoleta']
  },
  {
    id: 'es-clothing-009',
    word: 'calcetín',
    category: 'clothing',
    language: 'es',
    image_url: '/images/words/calcetin.webp',
    definition: 'Prenda de punto que cubre el pie y parte de la pierna.',
    features: {
      category: 'prenda de vestir',
      function: 'proteger el pie, abrigar',
      location: 'cajón, armario',
      properties: 'es de tela, viene en par, cubre el pie',
      associations: 'pie, zapato, par, lavadora'
    },
    phonetic: { first_sound: '/k/', syllables: 3, rhyming_word: 'tarín', first_phonemes: '/kal/' },
    difficulty: 2,
    tags: ['ropa', 'común'],
    sentence: 'Perdí un _____ y no encuentro su par.',
    opposite: '',
    synonyms: ['media', 'soquete']
  },
  {
    id: 'es-clothing-010',
    word: 'cinturón',
    category: 'clothing',
    language: 'es',
    image_url: '/images/words/cinturon.webp',
    definition: 'Banda de cuero o tela que se usa en la cintura.',
    features: {
      category: 'accesorio',
      function: 'ajustar la ropa, sostener pantalón',
      location: 'cintura, armario',
      properties: 'es largo, tiene hebilla, de cuero o tela',
      associations: 'pantalón, hebilla, cuero, cintura'
    },
    phonetic: { first_sound: '/s/', syllables: 3, rhyming_word: 'montón', first_phonemes: '/sin/' },
    difficulty: 3,
    tags: ['accesorio', 'común'],
    sentence: 'Se ajustó el _____ porque el pantalón le quedaba grande.',
    opposite: '',
    synonyms: ['correa', 'cinto']
  },
  {
    id: 'es-clothing-011',
    word: 'falda',
    category: 'clothing',
    language: 'es',
    image_url: '/images/words/falda.webp',
    definition: 'Prenda que cubre la parte inferior del cuerpo desde la cintura.',
    features: {
      category: 'prenda de vestir',
      function: 'vestir',
      location: 'armario, tienda',
      properties: 'no tiene perneras, cuelga desde la cintura',
      associations: 'vestido, mujer, cintura, pierna'
    },
    phonetic: { first_sound: '/f/', syllables: 2, rhyming_word: 'salda', first_phonemes: '/fa/' },
    difficulty: 1,
    tags: ['ropa', 'común'],
    sentence: 'Llevaba una _____ azul con blusa blanca.',
    opposite: '',
    synonyms: ['saya', 'maxifalda']
  },
  {
    id: 'es-clothing-012',
    word: 'abrigo',
    category: 'clothing',
    language: 'es',
    image_url: '/images/words/abrigo.webp',
    definition: 'Prenda de vestir gruesa que protege del frío.',
    features: {
      category: 'prenda de vestir',
      function: 'proteger del frío',
      location: 'armario, perchero',
      properties: 'es grueso, largo, abriga mucho',
      associations: 'invierno, frío, perchero, lana'
    },
    phonetic: { first_sound: '/a/', syllables: 3, rhyming_word: 'amigo', first_phonemes: '/a/' },
    difficulty: 2,
    tags: ['ropa', 'invierno'],
    sentence: 'Sal con el _____ que hoy hace mucho frío.',
    opposite: '',
    synonyms: ['gabán', 'tapado']
  },

  // ==========================================
  // VEHICLES (12 words)
  // ==========================================
  {
    id: 'es-vehicle-001',
    word: 'coche',
    category: 'vehicles',
    language: 'es',
    image_url: '/images/words/coche.webp',
    definition: 'Vehículo de motor con cuatro ruedas para transportar personas.',
    features: {
      category: 'vehículo de motor',
      function: 'transportar personas',
      location: 'calle, carretera, garaje',
      properties: 'tiene cuatro ruedas, motor, volante',
      associations: 'volante, rueda, carretera, gasolina'
    },
    phonetic: { first_sound: '/k/', syllables: 2, rhyming_word: 'noche', first_phonemes: '/ko/' },
    difficulty: 1,
    tags: ['transporte', 'común'],
    sentence: 'Aparqué el _____ en el garaje del edificio.',
    opposite: '',
    synonyms: ['automóvil', 'carro', 'auto']
  },
  {
    id: 'es-vehicle-002',
    word: 'bicicleta',
    category: 'vehicles',
    language: 'es',
    image_url: '/images/words/bicicleta.webp',
    definition: 'Vehículo de dos ruedas impulsado por pedales.',
    features: {
      category: 'vehículo sin motor',
      function: 'transporte, ejercicio',
      location: 'calle, carril bici, garaje',
      properties: 'tiene dos ruedas, pedales, manillar',
      associations: 'rueda, pedales, casco, cadena'
    },
    phonetic: { first_sound: '/b/', syllables: 4, rhyming_word: 'meta', first_phonemes: '/bi/' },
    difficulty: 2,
    tags: ['transporte', 'ejercicio'],
    sentence: 'Paseo en _____ por el parque los domingos.',
    opposite: '',
    synonyms: ['bici', 'velocípedo']
  },
  {
    id: 'es-vehicle-003',
    word: 'tren',
    category: 'vehicles',
    language: 'es',
    image_url: '/images/words/tren.webp',
    definition: 'Vehículo ferroviario que se desplaza por raíles.',
    features: {
      category: 'transporte público',
      function: 'transportar pasajeros y mercancías',
      location: 'estación, vías, raíles',
      properties: 'es largo, va por raíles, tiene vagones',
      associations: 'estación, vía, raíl, vagón'
    },
    phonetic: { first_sound: '/t/', syllables: 1, rhyming_word: 'bien', first_phonemes: '/tre/' },
    difficulty: 1,
    tags: ['transporte', 'público'],
    sentence: 'El _____ llega a las tres de la tarde.',
    opposite: '',
    synonyms: ['ferrocarril', 'locomotora']
  },
  {
    id: 'es-vehicle-004',
    word: 'avión',
    category: 'vehicles',
    language: 'es',
    image_url: '/images/words/avion.webp',
    definition: 'Vehículo aéreo con alas y motor que vuela.',
    features: {
      category: 'transporte aéreo',
      function: 'transportar personas por aire',
      location: 'aeropuerto, cielo',
      properties: 'tiene alas, motores, es grande',
      associations: 'aeropuerto, vuelo, ala, pasaporte'
    },
    phonetic: { first_sound: '/a/', syllables: 2, rhyming_word: 'camión', first_phonemes: '/a/' },
    difficulty: 1,
    tags: ['transporte', 'aéreo'],
    sentence: 'El _____ despega a las seis de la mañana.',
    opposite: '',
    synonyms: ['aeronave', 'aeroplano']
  },
  {
    id: 'es-vehicle-005',
    word: 'barco',
    category: 'vehicles',
    language: 'es',
    image_url: '/images/words/barco.webp',
    definition: 'Embarcación grande que navega por el agua.',
    features: {
      category: 'transporte marítimo',
      function: 'transportar por agua',
      location: 'mar, puerto, río',
      properties: 'flota en el agua, tiene velas o motor',
      associations: 'mar, puerto, vela, ancla'
    },
    phonetic: { first_sound: '/b/', syllables: 2, rhyming_word: 'carco', first_phonemes: '/bar/' },
    difficulty: 1,
    tags: ['transporte', 'marítimo'],
    sentence: 'El _____ zarpa del puerto rumbo a la isla.',
    opposite: '',
    synonyms: ['embarcación', 'nave']
  },
  {
    id: 'es-vehicle-006',
    word: 'autobús',
    category: 'vehicles',
    language: 'es',
    image_url: '/images/words/autobus.webp',
    definition: 'Vehículo grande de transporte público por carretera.',
    features: {
      category: 'transporte público',
      function: 'transportar muchas personas',
      location: 'parada, calle, estación',
      properties: 'es grande, tiene muchos asientos',
      associations: 'parada, pasaje, asiento, boleto'
    },
    phonetic: { first_sound: '/a/', syllables: 3, rhyming_word: 'plus', first_phonemes: '/aw/' },
    difficulty: 2,
    tags: ['transporte', 'público'],
    sentence: 'Espero el _____ en la parada cada mañana.',
    opposite: '',
    synonyms: ['bus', 'ómnibus']
  },
  {
    id: 'es-vehicle-007',
    word: 'moto',
    category: 'vehicles',
    language: 'es',
    image_url: '/images/words/moto.webp',
    definition: 'Vehículo de dos ruedas con motor.',
    features: {
      category: 'vehículo de motor',
      function: 'transporte',
      location: 'calle, carretera, garaje',
      properties: 'tiene dos ruedas, motor, manillar',
      associations: 'casco, rueda, velocidad, carretera'
    },
    phonetic: { first_sound: '/m/', syllables: 2, rhyming_word: 'toto', first_phonemes: '/mo/' },
    difficulty: 1,
    tags: ['transporte', 'motor'],
    sentence: 'Siempre lleva casco cuando monta en _____.',
    opposite: '',
    synonyms: ['motocicleta', 'moto']
  },
  {
    id: 'es-vehicle-008',
    word: 'camión',
    category: 'vehicles',
    language: 'es',
    image_url: '/images/words/camion.webp',
    definition: 'Vehículo grande para transportar mercancías pesadas.',
    features: {
      category: 'vehículo de carga',
      function: 'transportar mercancías',
      location: 'carretera, almacén',
      properties: 'es muy grande, tiene remolque',
      associations: 'carga, carretera, mercancía, volante'
    },
    phonetic: { first_sound: '/k/', syllables: 2, rhyming_word: 'campeón', first_phonemes: '/ka/' },
    difficulty: 2,
    tags: ['transporte', 'carga'],
    sentence: 'El _____ transporta mercancías de una ciudad a otra.',
    opposite: '',
    synonyms: ['trailer', 'remolque']
  },
  {
    id: 'es-vehicle-009',
    word: 'ambulancia',
    category: 'vehicles',
    language: 'es',
    image_url: '/images/words/ambulancia.webp',
    definition: 'Vehículo especial para transportar enfermos o heridos.',
    features: {
      category: 'vehículo de emergencia',
      function: 'atender emergencias médicas',
      location: 'hospital, calle',
      properties: 'tiene sirena, cruz roja, camilla',
      associations: 'hospital, sirena, emergencia, médico'
    },
    phonetic: { first_sound: '/a/', syllables: 4, rhyming_word: 'abundancia', first_phonemes: '/am/' },
    difficulty: 4,
    tags: ['emergencia', 'médico'],
    sentence: 'La _____ llegó rápidamente al lugar del accidente.',
    opposite: '',
    synonyms: ['vehículo sanitario']
  },
  {
    id: 'es-vehicle-010',
    word: 'taxi',
    category: 'vehicles',
    language: 'es',
    image_url: '/images/words/taxi.webp',
    definition: 'Vehículo de alquiler con conductor para transporte urbano.',
    features: {
      category: 'transporte privado',
      function: 'transporte urbano con conductor',
      location: 'calle, parada, ciudad',
      properties: 'tiene taxímetro, luz en el techo',
      associations: 'conductor, tarifa, ciudad, parada'
    },
    phonetic: { first_sound: '/t/', syllables: 2, rhyming_word: 'maxi', first_phonemes: '/ta/' },
    difficulty: 1,
    tags: ['transporte', 'urbano'],
    sentence: 'Tomé un _____ para llegar al aeropuerto.',
    opposite: '',
    synonyms: ['taxímetro', 'cab']
  },
  {
    id: 'es-vehicle-011',
    word: 'helicóptero',
    category: 'vehicles',
    language: 'es',
    image_url: '/images/words/helicoptero.webp',
    definition: 'Aeronave que se sostiene mediante hélices giratorias.',
    features: {
      category: 'transporte aéreo',
      function: 'volar verticalmente, rescate',
      location: 'helipuerto, cielo',
      properties: 'tiene hélices, puede flotar en el aire',
      associations: 'hélice, cielo, rescate, vuelo'
    },
    phonetic: { first_sound: '/e/', syllables: 5, rhyming_word: 'astero', first_phonemes: '/e/' },
    difficulty: 5,
    tags: ['transporte', 'aéreo'],
    sentence: 'El _____ sobrevoló la zona para rescatar a los montañeros.',
    opposite: '',
    synonyms: ['helicóptero', 'quiróptero']
  },
  {
    id: 'es-vehicle-012',
    word: 'metro',
    category: 'vehicles',
    language: 'es',
    image_url: '/images/words/metro.webp',
    definition: 'Sistema de tren urbano subterráneo.',
    features: {
      category: 'transporte público',
      function: 'transporte urbano masivo',
      location: 'estación, túnel, ciudad',
      properties: 'va bajo tierra, es rápido, tiene vagones',
      associations: 'estación, billete, túnel, andén'
    },
    phonetic: { first_sound: '/m/', syllables: 2, rhyming_word: 'retro', first_phonemes: '/me/' },
    difficulty: 1,
    tags: ['transporte', 'público', 'urbano'],
    sentence: 'Tomo el _____ todos los días para ir al trabajo.',
    opposite: '',
    synonyms: ['ferrocarril subterráneo', 'subterráneo']
  },

  // ==========================================
  // TOOLS (12 words)
  // ==========================================
  {
    id: 'es-tool-001',
    word: 'martillo',
    category: 'tools',
    language: 'es',
    image_url: '/images/words/martillo.webp',
    definition: 'Herramienta con cabeza pesada para golpear.',
    features: {
      category: 'herramienta de golpe',
      function: 'golpear clavos, clavar',
      location: 'caja de herramientas, taller',
      properties: 'tiene mango y cabeza de metal',
      associations: 'clavo, golpe, taller, madera'
    },
    phonetic: { first_sound: '/m/', syllables: 3, rhyming_word: 'tillo', first_phonemes: '/mar/' },
    difficulty: 2,
    tags: ['herramienta', 'construcción'],
    sentence: 'Usa el _____ para clavar los clavos en la pared.',
    opposite: '',
    synonyms: ['mazo', 'maceta']
  },
  {
    id: 'es-tool-002',
    word: 'clavo',
    category: 'tools',
    language: 'es',
    image_url: '/images/words/clavo.webp',
    definition: 'Pieza metálica puntiaguda para fijar cosas.',
    features: {
      category: 'fijación',
      function: 'fijar, colgar',
      location: 'caja de herramientas, ferretería',
      properties: 'es de metal, puntiagudo, cabe plana',
      associations: 'martillo, pared, madera, fijar'
    },
    phonetic: { first_sound: '/k/', syllables: 2, rhyming_word: 'nabo', first_phonemes: '/kla/' },
    difficulty: 1,
    tags: ['fijación', 'ferretería'],
    sentence: 'Necesito un _____ para colgar este cuadro.',
    opposite: '',
    synonyms: ['punta', 'tornillo']
  },
  {
    id: 'es-tool-003',
    word: 'destornillador',
    category: 'tools',
    language: 'es',
    image_url: '/images/words/destornillador.webp',
    definition: 'Herramienta para apretar o aflojar tornillos.',
    features: {
      category: 'herramienta de apriete',
      function: 'atornillar, desatornillar',
      location: 'caja de herramientas, taller',
      properties: 'tiene mango y punta plana o estrella',
      associations: 'tornillo, reparar, punta, mano'
    },
    phonetic: { first_sound: '/d/', syllables: 5, rhyming_word: 'olvidador', first_phonemes: '/des/' },
    difficulty: 5,
    tags: ['herramienta', 'reparación'],
    sentence: 'Usa el _____ para apretar ese tornillo.',
    opposite: '',
    synonyms: ['desarmador']
  },
  {
    id: 'es-tool-004',
    word: 'llave',
    category: 'tools',
    language: 'es',
    image_url: '/images/words/llave.webp',
    definition: 'Herramienta para apretar tuercas o abrir cerraduras.',
    features: {
      category: 'herramienta',
      function: 'apretar tuercas, abrir cerraduras',
      location: 'caja de herramientas, llavero',
      properties: 'tiene forma especial para girar',
      associations: 'cerradura, puerta, tuerca, girar'
    },
    phonetic: { first_sound: '/ʎ/', syllables: 2, rhyming_word: 'nave', first_phonemes: '/ʎa/' },
    difficulty: 1,
    tags: ['herramienta', 'común'],
    sentence: 'No encuentro la _____ de la puerta principal.',
    opposite: '',
    synonyms: ['llave inglesa', 'llave']
  },
  {
    id: 'es-tool-005',
    word: 'tijeras',
    category: 'tools',
    language: 'es',
    image_url: '/images/words/tijeras.webp',
    definition: 'Herramienta con dos hojas afiladas que cortan al juntarse.',
    features: {
      category: 'herramienta de corte',
      function: 'cortar papel, tela',
      location: 'cajón, oficina, costura',
      properties: 'tiene dos hojas afiladas, mango',
      associations: 'corte, papel, tela, mango'
    },
    phonetic: { first_sound: '/t/', syllables: 3, rhyming_word: 'maderas', first_phonemes: '/ti/' },
    difficulty: 2,
    tags: ['herramienta', 'corte', 'común'],
    sentence: 'Usa las _____ para recortar el papel.',
    opposite: '',
    synonyms: ['cizalla']
  },
  {
    id: 'es-tool-006',
    word: 'cuchillo',
    category: 'tools',
    language: 'es',
    image_url: '/images/words/cuchillo.webp',
    definition: 'Utensilio con hoja afilada para cortar.',
    features: {
      category: 'utensilio de corte',
      function: 'cortar alimentos',
      location: 'cocina, cajón, mesa',
      properties: 'tiene hoja afilada y mango',
      associations: 'corte, cocina, comida, tenedor'
    },
    phonetic: { first_sound: '/k/', syllables: 3, rhyming_word: 'brillo', first_phonemes: '/ku/' },
    difficulty: 1,
    tags: ['utensilio', 'corte', 'común'],
    sentence: 'Corta el pan con un _____ bien afilado.',
    opposite: '',
    synonyms: ['cuchilla', 'navaja']
  },
  {
    id: 'es-tool-007',
    word: 'sierra',
    category: 'tools',
    language: 'es',
    image_url: '/images/words/sierra.webp',
    definition: 'Herramienta con borde dentado para cortar madera.',
    features: {
      category: 'herramienta de corte',
      function: 'cortar madera',
      location: 'taller, caja de herramientas',
      properties: 'tiene borde dentado, hoja larga',
      associations: 'madera, corte, taller, diente'
    },
    phonetic: { first_sound: '/s/', syllables: 2, rhyming_word: 'tierra', first_phonemes: '/sie/' },
    difficulty: 2,
    tags: ['herramienta', 'corte'],
    sentence: 'Usa la _____ para cortar la tabla de madera.',
    opposite: '',
    synonyms: ['serrucho']
  },
  {
    id: 'es-tool-008',
    word: 'pala',
    category: 'tools',
    language: 'es',
    image_url: '/images/words/pala.webp',
    definition: 'Herramienta con mango y hoja plana para cavar o recoger.',
    features: {
      category: 'herramienta de excavación',
      function: 'cavar, recoger tierra',
      location: 'jardín, obra, campo',
      properties: 'tiene mango largo y hoja plana',
      associations: 'tierra, jardín, cavar, arena'
    },
    phonetic: { first_sound: '/p/', syllables: 2, rhyming_word: 'bala', first_phonemes: '/pa/' },
    difficulty: 1,
    tags: ['herramienta', 'jardín'],
    sentence: 'Usa la _____ para cavar el hoyo en el jardín.',
    opposite: '',
    synonyms: ['azada', 'pala']
  },
  {
    id: 'es-tool-009',
    word: 'escalera',
    category: 'tools',
    language: 'es',
    image_url: '/images/words/escalera.webp',
    definition: 'Herramienta con peldaños para alcanzar alturas.',
    features: {
      category: 'herramienta de acceso',
      function: 'subir a lugares altos',
      location: 'garaje, trastero, obra',
      properties: 'tiene peldaños, es plegable',
      associations: 'altura, peldaño, subida, caída'
    },
    phonetic: { first_sound: '/e/', syllables: 4, rhyming_word: 'bandera', first_phonemes: '/es/' },
    difficulty: 2,
    tags: ['herramienta', 'acceso'],
    sentence: 'Sube a la _____ para cambiar la bombilla.',
    opposite: '',
    synonyms: ['escalerilla', 'escalera de mano']
  },
  {
    id: 'es-tool-010',
    word: 'pincel',
    category: 'tools',
    language: 'es',
    image_url: '/images/words/pincel.webp',
    definition: 'Instrumento con cerdas para pintar con precisión.',
    features: {
      category: 'herramienta de pintura',
      function: 'pintar detalles',
      location: 'estudio, taller, caja de pintura',
      properties: 'tiene cerdas finas, mango largo',
      associations: 'pintura, arte, lienzo, color'
    },
    phonetic: { first_sound: '/p/', syllables: 2, rhyming_word: 'tieso', first_phonemes: '/pin/' },
    difficulty: 2,
    tags: ['herramienta', 'pintura', 'arte'],
    sentence: 'El artista mojó el _____ en la pintura azul.',
    opposite: '',
    synonyms: ['brocha fina']
  },
  {
    id: 'es-tool-011',
    word: 'brocha',
    category: 'tools',
    language: 'es',
    image_url: '/images/words/brocha.webp',
    definition: 'Herramienta ancha con cerdas para pintar superficies grandes.',
    features: {
      category: 'herramienta de pintura',
      function: 'pintar paredes y superficies',
      location: 'obra, taller, garaje',
      properties: 'es ancha, tiene cerdas, mango',
      associations: 'pintura, pared, rodillo, color'
    },
    phonetic: { first_sound: '/b/', syllables: 2, rhyming_word: 'nocha', first_phonemes: '/bro/' },
    difficulty: 2,
    tags: ['herramienta', 'pintura'],
    sentence: 'Pintó la pared con una _____ grande.',
    opposite: '',
    synonyms: ['rodillo', 'brocha']
  },
  {
    id: 'es-tool-012',
    word: 'cepillo',
    category: 'tools',
    language: 'es',
    image_url: '/images/words/cepillo.webp',
    definition: 'Utensilio con cerdas para limpiar o peinar.',
    features: {
      category: 'utensilio',
      function: 'cepillar, limpiar, peinar',
      location: 'baño, cocina, taller',
      properties: 'tiene cerdas, mango, superficie plana',
      associations: 'pelo, limpieza, cerda, peine'
    },
    phonetic: { first_sound: '/θ/', syllables: 3, rhyming_word: 'hijo', first_phonemes: '/θe/' },
    difficulty: 2,
    tags: ['utensilio', 'limpieza', 'común'],
    sentence: 'Me peino con el _____ todas las mañanas.',
    opposite: '',
    synonyms: ['cepillo de pelo', 'escobilla']
  },

  // ==========================================
  // PROFESSIONS (13 words)
  // ==========================================
  {
    id: 'es-profession-001',
    word: 'médico',
    category: 'professions',
    language: 'es',
    image_url: '/images/words/medico.webp',
    definition: 'Profesional que diagnostica y trata enfermedades.',
    features: {
      category: 'profesión sanitaria',
      function: 'curar, diagnosticar',
      location: 'hospital, consulta, clínica',
      properties: 'usa bata blanca, estetoscopio',
      associations: 'hospital, enfermo, receta, curar'
    },
    phonetic: { first_sound: '/m/', syllables: 3, rhyming_word: 'dico', first_phonemes: '/me/' },
    difficulty: 2,
    tags: ['sanidad', 'profesión'],
    sentence: 'El _____ me recetó medicina para la tos.',
    opposite: '',
    synonyms: ['doctor', 'galeno']
  },
  {
    id: 'es-profession-002',
    word: 'profesor',
    category: 'professions',
    language: 'es',
    image_url: '/images/words/profesor.webp',
    definition: 'Profesional que enseña y educa a los alumnos.',
    features: {
      category: 'profesión educativa',
      function: 'enseñar, educar',
      location: 'escuela, instituto, universidad',
      properties: 'enseña materias, corrige exámenes',
      associations: 'escuela, alumno, pizarra, libro'
    },
    phonetic: { first_sound: '/p/', syllables: 3, rhyming_word: 'visor', first_phonemes: '/pro/' },
    difficulty: 2,
    tags: ['educación', 'profesión'],
    sentence: 'El _____ explicó la lección en la pizarra.',
    opposite: '',
    synonyms: ['maestro', 'docente']
  },
  {
    id: 'es-profession-003',
    word: 'bombero',
    category: 'professions',
    language: 'es',
    image_url: '/images/words/bombero.webp',
    definition: 'Profesional que extingue incendios y realiza rescates.',
    features: {
      category: 'profesión de emergencia',
      function: 'apagar incendios, rescatar',
      location: 'parque de bomberos, ciudad',
      properties: 'usa casco, traje protector, manguera',
      associations: 'fuego, manguera, sirena, rescate'
    },
    phonetic: { first_sound: '/b/', syllables: 3, rhyming_word: 'entero', first_phonemes: '/bo/' },
    difficulty: 2,
    tags: ['emergencia', 'profesión'],
    sentence: 'El _____ apagó el incendio rápidamente.',
    opposite: '',
    synonyms: ['bombero']
  },
  {
    id: 'es-profession-004',
    word: 'policía',
    category: 'professions',
    language: 'es',
    image_url: '/images/words/policia.webp',
    definition: 'Profesional encargado de mantener el orden y la seguridad.',
    features: {
      category: 'profesión de seguridad',
      function: 'proteger, mantener el orden',
      location: 'calle, comisaría, ciudad',
      properties: 'usa uniforme, placa, armas',
      associations: 'seguridad, orden, multa, comisaría'
    },
    phonetic: { first_sound: '/p/', syllables: 3, rhyming_word: 'día', first_phonemes: '/po/' },
    difficulty: 2,
    tags: ['seguridad', 'profesión'],
    sentence: 'El _____ dirigió el tráfico en la intersección.',
    opposite: '',
    synonyms: ['agente', 'guardia']
  },
  {
    id: 'es-profession-005',
    word: 'enfermero',
    category: 'professions',
    language: 'es',
    image_url: '/images/words/enfermero.webp',
    definition: 'Profesional que cuida a los pacientes bajo supervisión médica.',
    features: {
      category: 'profesión sanitaria',
      function: 'cuidar pacientes, administrar medicinas',
      location: 'hospital, clínica, consulta',
      properties: 'usa bata blanca, atiende pacientes',
      associations: 'hospital, paciente, medicina, cura'
    },
    phonetic: { first_sound: '/e/', syllables: 4, rhyming_word: 'romero', first_phonemes: '/e/' },
    difficulty: 3,
    tags: ['sanidad', 'profesión'],
    sentence: 'El _____ tomó la temperatura al paciente.',
    opposite: '',
    synonyms: ['enfermera', 'auxiliar sanitario']
  },
  {
    id: 'es-profession-006',
    word: 'cocinero',
    category: 'professions',
    language: 'es',
    image_url: '/images/words/cocinero.webp',
    definition: 'Profesional que prepara alimentos en restaurantes.',
    features: {
      category: 'profesión gastronómica',
      function: 'cocinar, preparar platos',
      location: 'restaurante, cocina, hotel',
      properties: 'usa delantal, gorro de chef',
      associations: 'cocina, comida, receta, restaurante'
    },
    phonetic: { first_sound: '/k/', syllables: 4, rhyming_word: 'sombrero', first_phonemes: '/ko/' },
    difficulty: 3,
    tags: ['gastronomía', 'profesión'],
    sentence: 'El _____ preparó una paella deliciosa.',
    opposite: '',
    synonyms: ['chef', 'cocinilla']
  },
  {
    id: 'es-profession-007',
    word: 'panadero',
    category: 'professions',
    language: 'es',
    image_url: '/images/words/panadero.webp',
    definition: 'Profesional que elabora pan y productos de repostería.',
    features: {
      category: 'profesión gastronómica',
      function: 'hacer pan, repostería',
      location: 'panadería, horno',
      properties: 'trabaja con harina, amasa, hornea',
      associations: 'pan, harina, horno, panadería'
    },
    phonetic: { first_sound: '/p/', syllables: 4, rhyming_word: 'banquero', first_phonemes: '/pa/' },
    difficulty: 3,
    tags: ['gastronomía', 'profesión'],
    sentence: 'El _____ prepara el pan fresco cada madrugada.',
    opposite: '',
    synonyms: ['hornero', 'repostero']
  },
  {
    id: 'es-profession-008',
    word: 'carpintero',
    category: 'professions',
    language: 'es',
    image_url: '/images/words/carpintero.webp',
    definition: 'Profesional que trabaja la madera para hacer muebles.',
    features: {
      category: 'profesión artesanal',
      function: 'trabajar la madera, hacer muebles',
      location: 'taller, carpintería',
      properties: 'usa herramientas, trabaja con madera',
      associations: 'madera, mueble, taller, serrín'
    },
    phonetic: { first_sound: '/k/', syllables: 4, rhyming_word: 'cintero', first_phonemes: '/kar/' },
    difficulty: 4,
    tags: ['artesanía', 'profesión'],
    sentence: 'El _____ fabricó una mesa de roble preciosa.',
    opposite: '',
    synonyms: ['ebanista']
  },
  {
    id: 'es-profession-009',
    word: 'electricista',
    category: 'professions',
    language: 'es',
    image_url: '/images/words/electricista.webp',
    definition: 'Profesional que instala y repara instalaciones eléctricas.',
    features: {
      category: 'profesión técnica',
      function: 'instalar y reparar electricidad',
      location: 'obra, edificio, casa',
      properties: 'usa herramientas eléctricas, guantes',
      associations: 'electricidad, cable, luz, enchufe'
    },
    phonetic: { first_sound: '/e/', syllables: 5, rhyming_word: 'artista', first_phonemes: '/e/' },
    difficulty: 5,
    tags: ['técnico', 'profesión'],
    sentence: 'El _____ reparó la instalación eléctrica de la cocina.',
    opposite: '',
    synonyms: ['técnico electricista']
  },
  {
    id: 'es-profession-010',
    word: 'fontanero',
    category: 'professions',
    language: 'es',
    image_url: '/images/words/fontanero.webp',
    definition: 'Profesional que instala y repara tuberías y grifos.',
    features: {
      category: 'profesión técnica',
      function: 'reparar tuberías, instalar grifos',
      location: 'casa, edificio, obra',
      properties: 'usa herramientas, trabaja con tuberías',
      associations: 'tubería, grifo, agua, llave'
    },
    phonetic: { first_sound: '/f/', syllables: 4, rhyming_word: 'banquero', first_phonemes: '/fon/' },
    difficulty: 4,
    tags: ['técnico', 'profesión'],
    sentence: 'El _____ reparó la tubería que goteaba.',
    opposite: '',
    synonyms: ['plomero']
  },
  {
    id: 'es-profession-011',
    word: 'pintor',
    category: 'professions',
    language: 'es',
    image_url: '/images/words/pintor.webp',
    definition: 'Profesional que pinta edificios o crea obras de arte.',
    features: {
      category: 'profesión artística',
      function: 'pintar, decorar',
      location: 'obra, estudio, galería',
      properties: 'usa brochas, pintura, colores',
      associations: 'pintura, brocha, color, lienzo'
    },
    phonetic: { first_sound: '/p/', syllables: 2, rhyming_word: 'tractor', first_phonemes: '/pin/' },
    difficulty: 2,
    tags: ['arte', 'profesión'],
    sentence: 'El _____ pintó las paredes del salón de blanco.',
    opposite: '',
    synonyms: ['artista', 'pintor de brocha gorda']
  },
  {
    id: 'es-profession-012',
    word: 'músico',
    category: 'professions',
    language: 'es',
    image_url: '/images/words/musico.webp',
    definition: 'Profesional que toca instrumentos o compone música.',
    features: {
      category: 'profesión artística',
      function: 'tocar música, componer',
      location: 'escenario, estudio, orquesta',
      properties: 'toca instrumentos, lee partituras',
      associations: 'instrumento, nota, concierto, guitarra'
    },
    phonetic: { first_sound: '/m/', syllables: 3, rhyming_word: 'pico', first_phonemes: '/mu/' },
    difficulty: 2,
    tags: ['arte', 'profesión'],
    sentence: 'El _____ tocó la guitarra en el concierto.',
    opposite: '',
    synonyms: ['intérprete', 'artista']
  },
  {
    id: 'es-profession-013',
    word: 'granjero',
    category: 'professions',
    language: 'es',
    image_url: '/images/words/granjero.webp',
    definition: 'Profesional que trabaja en una granja cultivando o criando animales.',
    features: {
      category: 'profesión agrícola',
      function: 'cultivar, criar animales',
      location: 'granja, campo, pueblo',
      properties: 'trabaja al aire libre, madruga',
      associations: 'campo, animales, tractor, cosecha'
    },
    phonetic: { first_sound: '/g/', syllables: 3, rhyming_word: 'banquero', first_phonemes: '/gra/' },
    difficulty: 3,
    tags: ['agricultura', 'profesión'],
    sentence: 'El _____ ordeñó las vacas al amanecer.',
    opposite: '',
    synonyms: ['agricultor', 'campesino']
  },

  // ==========================================
  // COLORS (11 words)
  // ==========================================
  {
    id: 'es-color-001',
    word: 'rojo',
    category: 'colors',
    language: 'es',
    image_url: '/images/words/rojo.webp',
    definition: 'Color del fuego y de la sangre.',
    features: {
      category: 'color primario',
      function: 'describir objetos',
      location: 'en todas partes',
      properties: 'es cálido, intenso, llamativo',
      associations: 'fuego, sangre, pasión, tomate'
    },
    phonetic: { first_sound: '/r/', syllables: 2, rhyming_word: 'ojo', first_phonemes: '/ro/' },
    difficulty: 1,
    tags: ['color', 'primario', 'común'],
    sentence: 'La señal de stop es de color _____.',
    opposite: '',
    synonyms: ['bermejo', 'colorado']
  },
  {
    id: 'es-color-002',
    word: 'azul',
    category: 'colors',
    language: 'es',
    image_url: '/images/words/azul.webp',
    definition: 'Color del cielo y del mar.',
    features: {
      category: 'color primario',
      function: 'describir objetos',
      location: 'en todas partes',
      properties: 'es frío, sereno, profundo',
      associations: 'cielo, mar, tranquilo, frío'
    },
    phonetic: { first_sound: '/a/', syllables: 2, rhyming_word: 'cruz', first_phonemes: '/a/' },
    difficulty: 1,
    tags: ['color', 'primario', 'común'],
    sentence: 'El cielo está muy _____ hoy.',
    opposite: '',
    synonyms: ['celeste', 'añil']
  },
  {
    id: 'es-color-003',
    word: 'verde',
    category: 'colors',
    language: 'es',
    image_url: '/images/words/verde.webp',
    definition: 'Color de la hierba y las hojas de los árboles.',
    features: {
      category: 'color secundario',
      function: 'describir objetos',
      location: 'en todas partes',
      properties: 'es natural, fresco, esperanzador',
      associations: 'hierba, naturaleza, bosque, esperanza'
    },
    phonetic: { first_sound: '/b/', syllables: 2, rhyming_word: 'pierde', first_phonemes: '/be/' },
    difficulty: 1,
    tags: ['color', 'común'],
    sentence: 'Las hojas de los árboles son de color _____.',
    opposite: '',
    synonyms: ['esmeralda', 'verde']
  },
  {
    id: 'es-color-004',
    word: 'amarillo',
    category: 'colors',
    language: 'es',
    image_url: '/images/words/amarillo.webp',
    definition: 'Color del sol y del limón.',
    features: {
      category: 'color primario',
      function: 'describir objetos',
      location: 'en todas partes',
      properties: 'es cálido, luminoso, alegre',
      associations: 'sol, limón, plátano, luz'
    },
    phonetic: { first_sound: '/a/', syllables: 4, rhyming_word: 'tillo', first_phonemes: '/a/' },
    difficulty: 2,
    tags: ['color', 'primario', 'común'],
    sentence: 'El sol brilla con un color _____ intenso.',
    opposite: '',
    synonyms: ['gualdo', 'amarillo canario']
  },
  {
    id: 'es-color-005',
    word: 'negro',
    category: 'colors',
    language: 'es',
    image_url: '/images/words/negro.webp',
    definition: 'Color más oscuro, ausencia de luz.',
    features: {
      category: 'color',
      function: 'describir objetos',
      location: 'en todas partes',
      properties: 'es oscuro, ausencia de color',
      associations: 'noche, oscuridad, sombra, carbón'
    },
    phonetic: { first_sound: '/n/', syllables: 2, rhyming_word: 'agro', first_phonemes: '/ne/' },
    difficulty: 1,
    tags: ['color', 'común'],
    sentence: 'El gato negro es de color _____.',
    opposite: 'blanco',
    synonyms: ['oscuro', 'negrura']
  },
  {
    id: 'es-color-006',
    word: 'blanco',
    category: 'colors',
    language: 'es',
    image_url: '/images/words/blanco.webp',
    definition: 'Color de la nieve y la leche.',
    features: {
      category: 'color',
      function: 'describir objetos',
      location: 'en todas partes',
      properties: 'es claro, luminoso, puro',
      associations: 'nieve, leche, nube, pureza'
    },
    phonetic: { first_sound: '/b/', syllables: 2, rhyming_word: 'banco', first_phonemes: '/bla/' },
    difficulty: 1,
    tags: ['color', 'común'],
    sentence: 'La nieve cae _____ del cielo.',
    opposite: 'negro',
    synonyms: ['blanco', 'pálido']
  },
  {
    id: 'es-color-007',
    word: 'naranja',
    category: 'colors',
    language: 'es',
    image_url: '/images/words/naranja_color.webp',
    definition: 'Color entre amarillo y rojo, como la fruta del mismo nombre.',
    features: {
      category: 'color',
      function: 'describir objetos',
      location: 'en todas partes',
      properties: 'es cálido, vibrante, llamativo',
      associations: 'naranja, fuego, atardecer, zanahoria'
    },
    phonetic: { first_sound: '/n/', syllables: 3, rhyming_word: 'lanza', first_phonemes: '/na/' },
    difficulty: 2,
    tags: ['color', 'común'],
    sentence: 'El atardecer tiene un tono _____ precioso.',
    opposite: '',
    synonyms: ['anaranjado']
  },
  {
    id: 'es-color-008',
    word: 'morado',
    category: 'colors',
    language: 'es',
    image_url: '/images/words/morado.webp',
    definition: 'Color entre azul y rojo, como la uva oscura.',
    features: {
      category: 'color',
      function: 'describir objetos',
      location: 'en todas partes',
      properties: 'es intenso, misterioso, elegante',
      associations: 'uva, berenjena, realeza, vino'
    },
    phonetic: { first_sound: '/m/', syllables: 3, rhyming_word: 'dado', first_phonemes: '/mo/' },
    difficulty: 2,
    tags: ['color', 'común'],
    sentence: 'La berenjena tiene un color _____ oscuro.',
    opposite: '',
    synonyms: ['violeta', 'púrpura']
  },
  {
    id: 'es-color-009',
    word: 'rosa',
    category: 'colors',
    language: 'es',
    image_url: '/images/words/rosa_color.webp',
    definition: 'Color suave mezcla de rojo y blanco.',
    features: {
      category: 'color',
      function: 'describir objetos',
      location: 'en todas partes',
      properties: 'es suave, delicado, cálido',
      associations: 'flor, fresa, suave, primavera'
    },
    phonetic: { first_sound: '/r/', syllables: 2, rhyming_word: 'cosa', first_phonemes: '/ro/' },
    difficulty: 1,
    tags: ['color', 'común'],
    sentence: 'La flor del jardín es de color _____.',
    opposite: '',
    synonyms: ['rosado', 'encarnado']
  },
  {
    id: 'es-color-010',
    word: 'marrón',
    category: 'colors',
    language: 'es',
    image_url: '/images/words/marron.webp',
    definition: 'Color de la tierra y la madera.',
    features: {
      category: 'color',
      function: 'describir objetos',
      location: 'en todas partes',
      properties: 'es terroso, cálido, natural',
      associations: 'tierra, madera, chocolate, café'
    },
    phonetic: { first_sound: '/m/', syllables: 2, rhyming_word: 'tazón', first_phonemes: '/ma/' },
    difficulty: 2,
    tags: ['color', 'común'],
    sentence: 'El tronco del árbol es de color _____.',
    opposite: '',
    synonyms: ['castaño', 'marrón']
  },
  {
    id: 'es-color-011',
    word: 'gris',
    category: 'colors',
    language: 'es',
    image_url: '/images/words/gris.webp',
    definition: 'Color entre blanco y negro.',
    features: {
      category: 'color',
      function: 'describir objetos',
      location: 'en todas partes',
      properties: 'es neutro, sobrio, apagado',
      associations: 'nube, piedra, hormigón, neblina'
    },
    phonetic: { first_sound: '/g/', syllables: 1, rhyming_word: 'tis', first_phonemes: '/gri/' },
    difficulty: 1,
    tags: ['color', 'común'],
    sentence: 'El cielo está _____ hoy, parece que va a llover.',
    opposite: '',
    synonyms: ['grisáceo']
  },

  // ==========================================
  // ACTIONS (18 words)
  // ==========================================
  {
    id: 'es-action-001',
    word: 'comer',
    category: 'actions',
    language: 'es',
    image_url: '/images/words/comer.webp',
    definition: 'Acción de ingerir alimentos.',
    features: {
      category: 'acción básica',
      function: 'alimentarse',
      location: 'mesa, cocina, restaurante',
      properties: 'es una necesidad vital, usa la boca',
      associations: 'boca, alimento, mesa, hambre'
    },
    phonetic: { first_sound: '/k/', syllables: 2, rhyming_word: 'hacer', first_phonemes: '/ko/' },
    difficulty: 1,
    tags: ['acción', 'básica', 'común'],
    sentence: 'Vamos a _____ en el restaurante nuevo.',
    opposite: '',
    synonyms: ['ingerir', 'alimentarse']
  },
  {
    id: 'es-action-002',
    word: 'beber',
    category: 'actions',
    language: 'es',
    image_url: '/images/words/beber.webp',
    definition: 'Acción de ingerir líquidos.',
    features: {
      category: 'acción básica',
      function: 'hidratarse',
      location: 'mesa, bar, cocina',
      properties: 'es una necesidad vital, usa la boca',
      associations: 'vaso, agua, líquido, sed'
    },
    phonetic: { first_sound: '/b/', syllables: 2, rhyming_word: 'leer', first_phonemes: '/be/' },
    difficulty: 1,
    tags: ['acción', 'básica', 'común'],
    sentence: 'Tengo sed, quiero _____ un vaso de agua.',
    opposite: '',
    synonyms: ['tomar', 'ingerir']
  },
  {
    id: 'es-action-003',
    word: 'dormir',
    category: 'actions',
    language: 'es',
    image_url: '/images/words/dormir.webp',
    definition: 'Acción de descansar con los ojos cerrados.',
    features: {
      category: 'acción básica',
      function: 'descansar, recuperar energía',
      location: 'cama, habitación',
      properties: 'se hace con ojos cerrados, de noche',
      associations: 'cama, noche, descanso, sueño'
    },
    phonetic: { first_sound: '/d/', syllables: 2, rhyming_word: 'morir', first_phonemes: '/do/' },
    difficulty: 1,
    tags: ['acción', 'básica', 'común'],
    sentence: 'Necesito _____ ocho horas para descansar bien.',
    opposite: 'despertar',
    synonyms: ['descansar', 'snooze']
  },
  {
    id: 'es-action-004',
    word: 'correr',
    category: 'actions',
    language: 'es',
    image_url: '/images/words/correr.webp',
    definition: 'Acción de moverse rápidamente a pie.',
    features: {
      category: 'acción física',
      function: 'moverse rápido, ejercicio',
      location: 'calle, parque, pista',
      properties: 'es más rápido que caminar, usa piernas',
      associations: 'pies, velocidad, deporte, parque'
    },
    phonetic: { first_sound: '/k/', syllables: 2, rhyming_word: 'hacer', first_phonemes: '/ko/' },
    difficulty: 1,
    tags: ['acción', 'deporte'],
    sentence: 'Me gusta _____ por el parque por las mañanas.',
    opposite: '',
    synonyms: ['trotar', 'sprintar']
  },
  {
    id: 'es-action-005',
    word: 'caminar',
    category: 'actions',
    language: 'es',
    image_url: '/images/words/caminar.webp',
    definition: 'Acción de moverse a pie a ritmo normal.',
    features: {
      category: 'acción física',
      function: 'moverse, pasear',
      location: 'calle, parque, acera',
      properties: 'es movimiento suave, paso a paso',
      associations: 'pies, paseo, calle, paso'
    },
    phonetic: { first_sound: '/k/', syllables: 3, rhyming_word: 'aminar', first_phonemes: '/ka/' },
    difficulty: 1,
    tags: ['acción', 'básica'],
    sentence: 'Me gusta _____ por la playa al atardecer.',
    opposite: '',
    synonyms: ['pasear', 'andar']
  },
  {
    id: 'es-action-006',
    word: 'hablar',
    category: 'actions',
    language: 'es',
    image_url: '/images/words/hablar.webp',
    definition: 'Acción de comunicarse con palabras.',
    features: {
      category: 'acción comunicativa',
      function: 'comunicarse',
      location: 'en todas partes',
      properties: 'usa la voz, lengua, labios',
      associations: 'voz, palabra, lengua, conversación'
    },
    phonetic: { first_sound: '/a/', syllables: 2, rhyming_word: 'amar', first_phonemes: '/a/' },
    difficulty: 1,
    tags: ['acción', 'comunicación', 'común'],
    sentence: 'Necesito _____ contigo sobre un asunto importante.',
    opposite: 'callar',
    synonyms: ['decir', 'conversar']
  },
  {
    id: 'es-action-007',
    word: 'leer',
    category: 'actions',
    language: 'es',
    image_url: '/images/words/leer.webp',
    definition: 'Acción de comprender un texto escrito.',
    features: {
      category: 'acción intelectual',
      function: 'comprender textos',
      location: 'biblioteca, casa, escuela',
      properties: 'usa los ojos, comprensión',
      associations: 'libro, texto, ojos, biblioteca'
    },
    phonetic: { first_sound: '/l/', syllables: 2, rhyming_word: 'beber', first_phonemes: '/le/' },
    difficulty: 1,
    tags: ['acción', 'intelectual', 'común'],
    sentence: 'Me gusta _____ antes de ir a dormir.',
    opposite: '',
    synonyms: ['ojear', 'devorar']
  },
  {
    id: 'es-action-008',
    word: 'escribir',
    category: 'actions',
    language: 'es',
    image_url: '/images/words/escribir.webp',
    definition: 'Acción de plasmar ideas en un medio escrito.',
    features: {
      category: 'acción intelectual',
      function: 'plasmar ideas por escrito',
      location: 'escritorio, oficina, escuela',
      properties: 'usa manos, bolígrafo o teclado',
      associations: 'bolígrafo, papel, letra, libro'
    },
    phonetic: { first_sound: '/e/', syllables: 3, rhyming_word: 'vivir', first_phonemes: '/es/' },
    difficulty: 2,
    tags: ['acción', 'intelectual', 'común'],
    sentence: 'Tengo que _____ una carta para mi abuela.',
    opposite: '',
    synonyms: ['redactar', 'anotar']
  },
  {
    id: 'es-action-009',
    word: 'cocinar',
    category: 'actions',
    language: 'es',
    image_url: '/images/words/cocinar.webp',
    definition: 'Acción de preparar alimentos para comer.',
    features: {
      category: 'acción doméstica',
      function: 'preparar comida',
      location: 'cocina',
      properties: 'usa fuego, utensilios, ingredientes',
      associations: 'cocina, fuego, comida, receta'
    },
    phonetic: { first_sound: '/k/', syllables: 3, rhyming_word: 'inar', first_phonemes: '/ko/' },
    difficulty: 2,
    tags: ['acción', 'doméstica'],
    sentence: 'Voy a _____ una sopa de verduras para la cena.',
    opposite: '',
    synonyms: ['guisar', 'preparar']
  },
  {
    id: 'es-action-010',
    word: 'limpiar',
    category: 'actions',
    language: 'es',
    image_url: '/images/words/limpiar.webp',
    definition: 'Acción de quitar la suciedad de algo.',
    features: {
      category: 'acción doméstica',
      function: 'quitar suciedad',
      location: 'casa, oficina',
      properties: 'usa agua, jabón, trapo',
      associations: 'jabón, agua, escoba, trapo'
    },
    phonetic: { first_sound: '/l/', syllables: 2, rhyming_word: 'piar', first_phonemes: '/lim/' },
    difficulty: 2,
    tags: ['acción', 'doméstica', 'común'],
    sentence: 'Tengo que _____ la casa antes de que lleguen los invitados.',
    opposite: 'ensuciar',
    synonyms: ['fregar', 'asear']
  },
  {
    id: 'es-action-011',
    word: 'cantar',
    category: 'actions',
    language: 'es',
    image_url: '/images/words/cantar.webp',
    definition: 'Acción de producir sonidos musicales con la voz.',
    features: {
      category: 'acción artística',
      function: 'producir música con la voz',
      location: 'escenario, ducha, karaoke',
      properties: 'usa la voz, ritmo, melodía',
      associations: 'música, voz, canción, escenario'
    },
    phonetic: { first_sound: '/k/', syllables: 2, rhyming_word: 'altar', first_phonemes: '/kan/' },
    difficulty: 1,
    tags: ['acción', 'arte'],
    sentence: 'Le gusta _____ en la ducha cada mañana.',
    opposite: '',
    synonyms: ['entonar', 'vocalizar']
  },
  {
    id: 'es-action-012',
    word: 'bailar',
    category: 'actions',
    language: 'es',
    image_url: '/images/words/bailar.webp',
    definition: 'Acción de mover el cuerpo al ritmo de la música.',
    features: {
      category: 'acción artística',
      function: 'moverse con música',
      location: 'fiesta, discoteca, salón',
      properties: 'usa el cuerpo, ritmo, coordinación',
      associations: 'música, fiesta, ritmo, movimiento'
    },
    phonetic: { first_sound: '/b/', syllables: 2, rhyming_word: 'amar', first_phonemes: '/bai/' },
    difficulty: 1,
    tags: ['acción', 'arte'],
    sentence: 'Me encanta _____ salsa los sábados por la noche.',
    opposite: '',
    synonyms: ['danzar']
  },
  {
    id: 'es-action-013',
    word: 'nadar',
    category: 'actions',
    language: 'es',
    image_url: '/images/words/nadar.webp',
    definition: 'Acción de moverse en el agua.',
    features: {
      category: 'acción física',
      function: 'moverse en el agua, ejercicio',
      location: 'piscina, mar, lago',
      properties: 'usa brazos y piernas, en el agua',
      associations: 'agua, piscina, mar, traje de baño'
    },
    phonetic: { first_sound: '/n/', syllables: 2, rhyming_word: 'cada', first_phonemes: '/na/' },
    difficulty: 1,
    tags: ['acción', 'deporte'],
    sentence: 'Aprendí a _____ cuando tenía cinco años.',
    opposite: '',
    synonyms: ['flotar', 'bañarse']
  },
  {
    id: 'es-action-014',
    word: 'volar',
    category: 'actions',
    language: 'es',
    image_url: '/images/words/volar.webp',
    definition: 'Acción de moverse por el aire.',
    features: {
      category: 'acción de movimiento',
      function: 'moverse por el aire',
      location: 'cielo, aire',
      properties: 'no toca el suelo, usa alas',
      associations: 'pájaro, avión, cielo, alas'
    },
    phonetic: { first_sound: '/b/', syllables: 2, rhyming_word: 'olar', first_phonemes: '/bo/' },
    difficulty: 1,
    tags: ['acción', 'movimiento'],
    sentence: 'Los pájaros _____ sobre los árboles.',
    opposite: '',
    synonyms: ['planeasr', 'surcar']
  },
  {
    id: 'es-action-015',
    word: 'construir',
    category: 'actions',
    language: 'es',
    image_url: '/images/words/construir.webp',
    definition: 'Acción de edificar o fabricar algo.',
    features: {
      category: 'acción creativa',
      function: 'fabricar, edificar',
      location: 'obra, taller',
      properties: 'usa materiales, herramientas',
      associations: 'obra, edificio, herramienta, ladrillo'
    },
    phonetic: { first_sound: '/k/', syllables: 3, rhyming_word: 'ruir', first_phonemes: '/kon/' },
    difficulty: 3,
    tags: ['acción', 'creación'],
    sentence: 'Van a _____ un nuevo edificio en la esquina.',
    opposite: 'destruir',
    synonyms: ['edificar', 'fabricar']
  },
  {
    id: 'es-action-016',
    word: 'pintar',
    category: 'actions',
    language: 'es',
    image_url: '/images/words/pintar.webp',
    definition: 'Acción de aplicar color sobre una superficie.',
    features: {
      category: 'acción artística',
      function: 'aplicar color, crear arte',
      location: 'estudio, obra, lienzo',
      properties: 'usa pintura, brocha o pincel',
      associations: 'brocha, color, lienzo, pared'
    },
    phonetic: { first_sound: '/p/', syllables: 2, rhyming_word: 'tantear', first_phonemes: '/pin/' },
    difficulty: 1,
    tags: ['acción', 'arte'],
    sentence: 'Va a _____ las paredes del dormitorio de azul.',
    opposite: '',
    synonyms: ['colorear', 'decorar']
  },
  {
    id: 'es-action-017',
    word: 'tocar',
    category: 'actions',
    language: 'es',
    image_url: '/images/words/tocar.webp',
    definition: 'Acción de entrar en contacto con algo mediante las manos o un instrumento.',
    features: {
      category: 'acción sensorial',
      function: 'sentir con las manos, tocar instrumentos',
      location: 'en todas partes',
      properties: 'usa las manos o los dedos',
      associations: 'mano, dedo, instrumento, piel'
    },
    phonetic: { first_sound: '/t/', syllables: 2, rhyming_word: 'cocar', first_phonemes: '/to/' },
    difficulty: 1,
    tags: ['acción', 'sensorial', 'común'],
    sentence: 'Aprende a _____ la guitarra con paciencia.',
    opposite: '',
    synonyms: ['palpar', 'interpretar']
  },
  {
    id: 'es-action-018',
    word: 'cortar',
    category: 'actions',
    language: 'es',
    image_url: '/images/words/cortar.webp',
    definition: 'Acción de dividir algo en partes con un instrumento afilado.',
    features: {
      category: 'acción física',
      function: 'dividir, separar',
      location: 'cocina, taller',
      properties: 'usa instrumento afilado',
      associations: 'cuchillo, tijeras, sierra, trozo'
    },
    phonetic: { first_sound: '/k/', syllables: 2, rhyming_word: 'otrar', first_phonemes: '/kor/' },
    difficulty: 1,
    tags: ['acción', 'común'],
    sentence: 'Voy a _____ el pastel en ocho trozos.',
    opposite: 'unir',
    synonyms: ['dividir', 'seccionar']
  },

  // ==========================================
  // PLACES (15 words)
  // ==========================================
  {
    id: 'es-place-001',
    word: 'casa',
    category: 'places',
    language: 'es',
    image_url: '/images/words/casa.webp',
    definition: 'Edificio donde viven las personas.',
    features: {
      category: 'edificio residencial',
      function: 'vivir, habitar',
      location: 'ciudad, pueblo, barrio',
      properties: 'tiene habitaciones, techo, paredes',
      associations: 'hogar, familia, puerta, ventana'
    },
    phonetic: { first_sound: '/k/', syllables: 2, rhyming_word: 'brazo', first_phonemes: '/ka/' },
    difficulty: 1,
    tags: ['edificio', 'común'],
    sentence: 'Mi _____ está cerca del parque.',
    opposite: '',
    synonyms: ['hogar', 'vivienda', 'domicilio']
  },
  {
    id: 'es-place-002',
    word: 'escuela',
    category: 'places',
    language: 'es',
    image_url: '/images/words/escuela.webp',
    definition: 'Lugar donde se impide educación a los estudiantes.',
    features: {
      category: 'edificio educativo',
      function: 'educar, enseñar',
      location: 'ciudad, pueblo, barrio',
      properties: 'tiene aulas, patios, biblioteca',
      associations: 'profesor, alumno, libro, pizarra'
    },
    phonetic: { first_sound: '/e/', syllables: 3, rhyming_word: 'muela', first_phonemes: '/es/' },
    difficulty: 1,
    tags: ['educación', 'común'],
    sentence: 'Los niños van a la _____ todos los días.',
    opposite: '',
    synonyms: ['colegio', 'instituto']
  },
  {
    id: 'es-place-003',
    word: 'hospital',
    category: 'places',
    language: 'es',
    image_url: '/images/words/hospital.webp',
    definition: 'Centro sanitario donde se atienden enfermos.',
    features: {
      category: 'edificio sanitario',
      function: 'curar, atender enfermos',
      location: 'ciudad',
      properties: 'tiene consultas, quirófanos, camas',
      associations: 'médico, enfermero, curar, enfermo'
    },
    phonetic: { first_sound: '/o/', syllables: 3, rhyming_word: 'tal', first_phonemes: '/os/' },
    difficulty: 2,
    tags: ['sanidad', 'común'],
    sentence: 'Llevaron al herido al _____ más cercano.',
    opposite: '',
    synonyms: ['clínica', 'sanatorio']
  },
  {
    id: 'es-place-004',
    word: 'parque',
    category: 'places',
    language: 'es',
    image_url: '/images/words/parque.webp',
    definition: 'Espacio verde público para el recreo.',
    features: {
      category: 'espacio público',
      function: 'recreo, pasear',
      location: 'ciudad, barrio',
      properties: 'tiene árboles, bancos, caminos',
      associations: 'árbol, banco, niño, jardín'
    },
    phonetic: { first_sound: '/p/', syllables: 2, rhyming_word: 'banque', first_phonemes: '/par/' },
    difficulty: 1,
    tags: ['espacio público', 'común'],
    sentence: 'Los niños juegan en el _____ después de clase.',
    opposite: '',
    synonyms: ['jardín', 'plaza verde']
  },
  {
    id: 'es-place-005',
    word: 'playa',
    category: 'places',
    language: 'es',
    image_url: '/images/words/playa.webp',
    definition: 'Orilla del mar cubierta de arena.',
    features: {
      category: 'espacio natural',
      function: 'recreo, bañarse',
      location: 'costa, mar',
      properties: 'tiene arena, agua, sol',
      associations: 'mar, arena, sol, toalla'
    },
    phonetic: { first_sound: '/p/', syllables: 2, rhyming_word: 'talla', first_phonemes: '/pla/' },
    difficulty: 1,
    tags: ['naturaleza', 'costa'],
    sentence: 'Pasamos el día en la _____ tomando el sol.',
    opposite: '',
    synonyms: ['costa', 'litoral']
  },
  {
    id: 'es-place-006',
    word: 'montaña',
    category: 'places',
    language: 'es',
    image_url: '/images/words/montana.webp',
    definition: 'Elevación natural del terreno muy alta.',
    features: {
      category: 'accidente geográfico',
      function: 'excursionismo, naturaleza',
      location: 'campo, sierra',
      properties: 'es alta, tiene cumbre, laderas',
      associations: 'cima, nieve, sendero, roca'
    },
    phonetic: { first_sound: '/m/', syllables: 3, rhyming_word: 'mañana', first_phonemes: '/mon/' },
    difficulty: 2,
    tags: ['naturaleza', 'geografía'],
    sentence: 'Subimos a la _____ y disfrutamos de las vistas.',
    opposite: '',
    synonyms: ['cerro', 'serra', 'pico']
  },
  {
    id: 'es-place-007',
    word: 'río',
    category: 'places',
    language: 'es',
    image_url: '/images/words/rio.webp',
    definition: 'Corriente natural de agua que fluye hacia el mar.',
    features: {
      category: 'accidente geográfico',
      function: 'fluir agua',
      location: 'campo, ciudad, valle',
      properties: 'tiene agua corriente, orillas, cauce',
      associations: 'agua, puente, pez, orilla'
    },
    phonetic: { first_sound: '/r/', syllables: 2, rhyming_word: 'mío', first_phonemes: '/ri/' },
    difficulty: 1,
    tags: ['naturaleza', 'geografía'],
    sentence: 'Pescamos truchas en el _____ del pueblo.',
    opposite: '',
    synonyms: ['afluente', 'cauce']
  },
  {
    id: 'es-place-008',
    word: 'mar',
    category: 'places',
    language: 'es',
    image_url: '/images/words/mar.webp',
    definition: 'Masa de agua salada que cubre gran parte de la Tierra.',
    features: {
      category: 'accidente geográfico',
      function: 'hábitat marino, navegación',
      location: 'costa, playa',
      properties: 'es inmenso, azul, salado',
      associations: 'playa, ola, pez, barco'
    },
    phonetic: { first_sound: '/m/', syllables: 1, rhyming_word: 'par', first_phonemes: '/mar/' },
    difficulty: 1,
    tags: ['naturaleza', 'geografía'],
    sentence: 'El _____ está muy tranquilo hoy.',
    opposite: '',
    synonyms: ['océano', 'mar océano']
  },
  {
    id: 'es-place-009',
    word: 'biblioteca',
    category: 'places',
    language: 'es',
    image_url: '/images/words/biblioteca.webp',
    definition: 'Lugar donde se guardan libros para consulta o préstamo.',
    features: {
      category: 'edificio cultural',
      function: 'consultar y prestar libros',
      location: 'ciudad, escuela, universidad',
      properties: 'tiene estanterías, libros, mesas de lectura',
      associations: 'libro, lectura, silencio, estudio'
    },
    phonetic: { first_sound: '/b/', syllables: 4, rhyming_word: 'disco', first_phonemes: '/bi/' },
    difficulty: 4,
    tags: ['cultura', 'educación'],
    sentence: 'Estudio en la _____ porque hay silencio.',
    opposite: '',
    synonyms: ['hemeroteca', 'archivo']
  },
  {
    id: 'es-place-010',
    word: 'mercado',
    category: 'places',
    language: 'es',
    image_url: '/images/words/mercado.webp',
    definition: 'Lugar donde se compran y venden productos.',
    features: {
      category: 'edificio comercial',
      function: 'comprar y vender',
      location: 'ciudad, pueblo, barrio',
      properties: 'tiene puestos, productos frescos',
      associations: 'comprar, fruta, verdura, vendedor'
    },
    phonetic: { first_sound: '/m/', syllables: 3, rhyming_word: 'cucado', first_phonemes: '/mer/' },
    difficulty: 2,
    tags: ['comercio', 'común'],
    sentence: 'Compré fruta fresca en el _____ del barrio.',
    opposite: '',
    synonyms: ['plaza de abastos', 'bazar']
  },
  {
    id: 'es-place-011',
    word: 'restaurante',
    category: 'places',
    language: 'es',
    image_url: '/images/words/restaurante.webp',
    definition: 'Establecimiento donde se sirven comidas y bebidas.',
    features: {
      category: 'edificio de hostelería',
      function: 'servir comidas',
      location: 'ciudad, pueblo, carretera',
      properties: 'tiene mesas, cocina, camareros',
      associations: 'comida, camarero, menú, cuenta'
    },
    phonetic: { first_sound: '/r/', syllables: 4, rhyming_word: 'instante', first_phonemes: '/res/' },
    difficulty: 3,
    tags: ['hostelería', 'común'],
    sentence: 'Cenamos en un _____ italiano muy bueno.',
    opposite: '',
    synonyms: ['comedor', 'taberna']
  },
  {
    id: 'es-place-012',
    word: 'iglesia',
    category: 'places',
    language: 'es',
    image_url: '/images/words/iglesia.webp',
    definition: 'Edificio destinado al culto religioso.',
    features: {
      category: 'edificio religioso',
      function: 'culto, ceremonias',
      location: 'ciudad, pueblo, plaza',
      properties: 'tiene campanario, altar, bancos',
      associations: 'oración, campana, misa, cruz'
    },
    phonetic: { first_sound: '/i/', syllables: 3, rhyming_word: 'mesa', first_phonemes: '/i/' },
    difficulty: 2,
    tags: ['religión', 'común'],
    sentence: 'La _____ del pueblo tiene un campanario muy alto.',
    opposite: '',
    synonyms: ['templo', 'catedral']
  },
  {
    id: 'es-place-013',
    word: 'puente',
    category: 'places',
    language: 'es',
    image_url: '/images/words/puente.webp',
    definition: 'Estructura que permite pasar sobre un obstáculo.',
    features: {
      category: 'estructura',
      function: 'cruzar ríos, valles o carreteras',
      location: 'río, valle, carretera',
      properties: 'es una estructura elevada, firme',
      associations: 'río, cruzar, camino, estructura'
    },
    phonetic: { first_sound: '/p/', syllables: 2, rhyming_word: 'mente', first_phonemes: '/pwe/' },
    difficulty: 1,
    tags: ['estructura', 'común'],
    sentence: 'El _____ cruza el río de un lado a otro.',
    opposite: '',
    synonyms: ['viaducto', 'pasarela']
  },
  {
    id: 'es-place-014',
    word: 'calle',
    category: 'places',
    language: 'es',
    image_url: '/images/words/calle.webp',
    definition: 'Vía pública urbana para transitar.',
    features: {
      category: 'vía pública',
      function: 'transitar, circular',
      location: 'ciudad, pueblo',
      properties: 'tiene aceras, calzada, edificios',
      associations: 'acera, semáforo, coche, peatón'
    },
    phonetic: { first_sound: '/k/', syllables: 2, rhyming_word: 'valle', first_phonemes: '/ka/' },
    difficulty: 1,
    tags: ['vía', 'común'],
    sentence: 'Camina por la _____ hasta llegar a la plaza.',
    opposite: '',
    synonyms: ['avenida', 'bulevar']
  },
  {
    id: 'es-place-015',
    word: 'plaza',
    category: 'places',
    language: 'es',
    image_url: '/images/words/plaza.webp',
    definition: 'Espacio público abierto rodeado de edificios.',
    features: {
      category: 'espacio público',
      function: 'encuentro, recreo',
      location: 'ciudad, pueblo',
      properties: 'es abierta, tiene bancos, fuentes',
      associations: 'fuente, banco, gente, centro'
    },
    phonetic: { first_sound: '/p/', syllables: 2, rhyming_word: 'taza', first_phonemes: '/pla/' },
    difficulty: 1,
    tags: ['espacio público', 'común'],
    sentence: 'La _____ del pueblo tiene una fuente grande.',
    opposite: '',
    synonyms: ['glorieta', 'plazoleta']
  },

  // ==========================================
  // EMOTIONS (10 words)
  // ==========================================
  {
    id: 'es-emotion-001',
    word: 'feliz',
    category: 'emotions',
    language: 'es',
    image_url: '/images/words/feliz.webp',
    definition: 'Que siente alegría y satisfacción.',
    features: {
      category: 'emoción positiva',
      function: 'expresar alegría',
      location: 'interior, expresión facial',
      properties: 'sonrisa, bienestar, satisfacción',
      associations: 'alegría, sonrisa, risa, contento'
    },
    phonetic: { first_sound: '/f/', syllables: 2, rhyming_word: 'vez', first_phonemes: '/fe/' },
    difficulty: 1,
    tags: ['emoción', 'positiva', 'común'],
    sentence: 'Estoy muy _____ porque aprobé el examen.',
    opposite: 'triste',
    synonyms: ['contento', 'alegre']
  },
  {
    id: 'es-emotion-002',
    word: 'triste',
    category: 'emotions',
    language: 'es',
    image_url: '/images/words/triste.webp',
    definition: 'Que siente pena o desconsuelo.',
    features: {
      category: 'emoción negativa',
      function: 'expresar pena',
      location: 'interior, expresión facial',
      properties: 'llanto, melancolía, bajón',
      associations: 'llanto, pena, lágrima, soledad'
    },
    phonetic: { first_sound: '/t/', syllables: 2, rhyming_word: 'viste', first_phonemes: '/tri/' },
    difficulty: 1,
    tags: ['emoción', 'negativa', 'común'],
    sentence: 'Se puso _____ cuando se despidió de su amigo.',
    opposite: 'feliz',
    synonyms: ['afligido', 'melancólico']
  },
  {
    id: 'es-emotion-003',
    word: 'enfadado',
    category: 'emotions',
    language: 'es',
    image_url: '/images/words/enfadado.webp',
    definition: 'Que siente enojo o irritación.',
    features: {
      category: 'emoción negativa',
      function: 'expresar enfado',
      location: 'interior, expresión facial',
      properties: 'ceño fruncido, tensión, grito',
      associations: 'ira, enfado, gritar, furia'
    },
    phonetic: { first_sound: '/e/', syllables: 4, rhyming_word: 'lado', first_phonemes: '/e/' },
    difficulty: 3,
    tags: ['emoción', 'negativa', 'común'],
    sentence: 'Estaba _____ porque le cancelaron el vuelo.',
    opposite: '',
    synonyms: ['enojado', 'irritado', 'furioso']
  },
  {
    id: 'es-emotion-004',
    word: 'asustado',
    category: 'emotions',
    language: 'es',
    image_url: '/images/words/asustado.webp',
    definition: 'Que siente miedo o temor.',
    features: {
      category: 'emoción negativa',
      function: 'expresar miedo',
      location: 'interior, expresión facial',
      properties: 'ojos abiertos, tensión, temblor',
      associations: 'miedo, terror, pesadilla, gritar'
    },
    phonetic: { first_sound: '/a/', syllables: 4, rhyming_word: 'lado', first_phonemes: '/a/' },
    difficulty: 3,
    tags: ['emoción', 'negativa'],
    sentence: 'El niño estaba _____ por la tormenta.',
    opposite: '',
    synonyms: ['atemorizado', 'asustadizo']
  },
  {
    id: 'es-emotion-005',
    word: 'sorprendido',
    category: 'emotions',
    language: 'es',
    image_url: '/images/words/sorprendido.webp',
    definition: 'Que siente asombro por algo inesperado.',
    features: {
      category: 'emoción',
      function: 'expresar asombro',
      location: 'interior, expresión facial',
      properties: 'boca abierta, ojos abiertos, exclamación',
      associations: 'asombro, maravilla, exclamación, shock'
    },
    phonetic: { first_sound: '/s/', syllables: 4, rhyming_word: 'enido', first_phonemes: '/su/' },
    difficulty: 4,
    tags: ['emoción', 'común'],
    sentence: 'Quedó _____ cuando vio el regalo de cumpleaños.',
    opposite: '',
    synonyms: ['asombrado', 'maravillado']
  },
  {
    id: 'es-emotion-006',
    word: 'cansado',
    category: 'emotions',
    language: 'es',
    image_url: '/images/words/cansado.webp',
    definition: 'Que siente fatiga o agotamiento.',
    features: {
      category: 'estado físico',
      function: 'expresar fatiga',
      location: 'interior, cuerpo',
      properties: 'somnolencia, falta de energía, bostezo',
      associations: 'sueño, fatiga, descanso, agotamiento'
    },
    phonetic: { first_sound: '/k/', syllables: 3, rhyming_word: 'lado', first_phonemes: '/ka/' },
    difficulty: 2,
    tags: ['estado', 'común'],
    sentence: 'Después de correr estoy muy _____.',
    opposite: 'descansado',
    synonyms: ['agotado', 'fatigado']
  },
  {
    id: 'es-emotion-007',
    word: 'tranquilo',
    category: 'emotions',
    language: 'es',
    image_url: '/images/words/tranquilo.webp',
    definition: 'Que siente paz y calma.',
    features: {
      category: 'emoción positiva',
      function: 'expresar calma',
      location: 'interior, cuerpo',
      properties: 'relajación, serenidad, paz',
      associations: 'paz, calma, relajado, sereno'
    },
    phonetic: { first_sound: '/t/', syllables: 3, rhyming_word: 'ilo', first_phonemes: '/tra/' },
    difficulty: 2,
    tags: ['emoción', 'positiva', 'común'],
    sentence: 'Después de la meditación me siento muy _____.',
    opposite: 'nervioso',
    synonyms: ['calmado', 'sereno', 'apacible']
  },
  {
    id: 'es-emotion-008',
    word: 'nervioso',
    category: 'emotions',
    language: 'es',
    image_url: '/images/words/nervioso.webp',
    definition: 'Que siente inquietud o agitación.',
    features: {
      category: 'emoción',
      function: 'expresar inquietud',
      location: 'interior, cuerpo',
      properties: 'inquietud, sudor, temblor',
      associations: 'ansiedad, miedo, examen, entrevista'
    },
    phonetic: { first_sound: '/n/', syllables: 3, rhyming_word: 'ocioso', first_phonemes: '/ne/' },
    difficulty: 3,
    tags: ['emoción', 'común'],
    sentence: 'Estaba _____ antes del examen final.',
    opposite: 'tranquilo',
    synonyms: ['ansioso', 'inquieto']
  },
  {
    id: 'es-emotion-009',
    word: 'orgulloso',
    category: 'emotions',
    language: 'es',
    image_url: '/images/words/orgulloso.webp',
    definition: 'Que siente satisfacción por un logro propio o ajeno.',
    features: {
      category: 'emoción positiva',
      function: 'expresar satisfacción',
      location: 'interior, expresión',
      properties: 'satisfacción, cabeza alta, pecho inflado',
      associations: 'logro, satisfacción, éxito, mérito'
    },
    phonetic: { first_sound: '/o/', syllables: 4, rhyming_word: 'ocultoso', first_phonemes: '/or/' },
    difficulty: 4,
    tags: ['emoción', 'positiva'],
    sentence: 'Estaba _____ de su hijo por graduarse.',
    opposite: '',
    synonyms: ['satisfecho', 'altivo']
  },
  {
    id: 'es-emotion-010',
    word: 'avergonzado',
    category: 'emotions',
    language: 'es',
    image_url: '/images/words/avergonzado.webp',
    definition: 'Que siente vergüenza o pudor.',
    features: {
      category: 'emoción',
      function: 'expresar vergüenza',
      location: 'interior, expresión facial',
      properties: 'mejillas rojas, bajar la mirada',
      associations: 'vergüenza, rubor, culpa, pudor'
    },
    phonetic: { first_sound: '/a/', syllables: 5, rhyming_word: 'estado', first_phonemes: '/a/' },
    difficulty: 5,
    tags: ['emoción'],
    sentence: 'Se sintió _____ al equivocarse en público.',
    opposite: '',
    synonyms: ['apenado', 'ruborizado']
  },

  // ==========================================
  // NATURE (15 words)
  // ==========================================
  {
    id: 'es-nature-001',
    word: 'árbol',
    category: 'nature',
    language: 'es',
    image_url: '/images/words/arbol.webp',
    definition: 'Planta de tronco leñoso que crece en altura.',
    features: {
      category: 'planta',
      function: 'dar sombra, producir oxígeno',
      location: 'bosque, parque, jardín',
      properties: 'tiene tronco, ramas, hojas, raíces',
      associations: 'hoja, rama, bosque, raíz'
    },
    phonetic: { first_sound: '/a/', syllables: 2, rhyming_word: 'vol', first_phonemes: '/ar/' },
    difficulty: 1,
    tags: ['planta', 'común'],
    sentence: 'El _____ da sombra en el jardín durante el verano.',
    opposite: '',
    synonyms: ['planta', 'arbusto']
  },
  {
    id: 'es-nature-002',
    word: 'flor',
    category: 'nature',
    language: 'es',
    image_url: '/images/words/flor.webp',
    definition: 'Parte colorida de las plantas que produce semillas.',
    features: {
      category: 'parte de la planta',
      function: 'reproducir, decorar',
      location: 'jardín, campo, maceta',
      properties: 'es colorida, tiene pétalos, aroma',
      associations: 'pétalo, jardín, rosa, primavera'
    },
    phonetic: { first_sound: '/f/', syllables: 1, rhyming_word: 'sol', first_phonemes: '/flo/' },
    difficulty: 1,
    tags: ['planta', 'común'],
    sentence: 'La _____ del jardín tiene un aroma delicioso.',
    opposite: '',
    synonyms: ['rosa', 'pétalo']
  },
  {
    id: 'es-nature-003',
    word: 'sol',
    category: 'nature',
    language: 'es',
    image_url: '/images/words/sol.webp',
    definition: 'Estrella que ilumina y calienta la Tierra.',
    features: {
      category: 'astro',
      function: 'iluminar, calentar',
      location: 'cielo',
      properties: 'es brillante, amarillo, calienta',
      associations: 'luz, calor, día, cielo'
    },
    phonetic: { first_sound: '/s/', syllables: 1, rhyming_word: 'flor', first_phonemes: '/so/' },
    difficulty: 1,
    tags: ['astro', 'común'],
    sentence: 'El _____ brilla intensamente en verano.',
    opposite: '',
    synonyms: ['astro rey']
  },
  {
    id: 'es-nature-004',
    word: 'luna',
    category: 'nature',
    language: 'es',
    image_url: '/images/words/luna.webp',
    definition: 'Satélite natural que orbita alrededor de la Tierra.',
    features: {
      category: 'astro',
      function: 'iluminar la noche',
      location: 'cielo nocturno',
      properties: 'es blanca, redonda, brilla de noche',
      associations: 'noche, estrella, cielo, oscuridad'
    },
    phonetic: { first_sound: '/l/', syllables: 2, rhyming_word: 'cuna', first_phonemes: '/lu/' },
    difficulty: 1,
    tags: ['astro', 'común'],
    sentence: 'La _____ llena ilumina el cielo nocturno.',
    opposite: '',
    synonyms: ['satélite']
  },
  {
    id: 'es-nature-005',
    word: 'estrella',
    category: 'nature',
    language: 'es',
    image_url: '/images/words/estrella.webp',
    definition: 'Cuerpo celeste brillante visible en el cielo nocturno.',
    features: {
      category: 'astro',
      function: 'brillar en la noche',
      location: 'cielo nocturno',
      properties: 'es pequeña, brilla, puntuda',
      associations: 'noche, cielo, brillo, constelación'
    },
    phonetic: { first_sound: '/e/', syllables: 3, rhyming_word: 'ella', first_phonemes: '/es/' },
    difficulty: 2,
    tags: ['astro', 'común'],
    sentence: 'Vi una _____ fugaz y pedí un deseo.',
    opposite: '',
    synonyms: ['astro', 'cuerpo celeste']
  },
  {
    id: 'es-nature-006',
    word: 'lluvia',
    category: 'nature',
    language: 'es',
    image_url: '/images/words/lluvia.webp',
    definition: 'Agua que cae de las nubes en forma de gotas.',
    features: {
      category: 'fenómeno meteorológico',
      function: 'regar la tierra',
      location: 'cielo, suelo',
      properties: 'es líquida, cae del cielo, moja',
      associations: 'paraguas, gota, nube, mojado'
    },
    phonetic: { first_sound: '/ʎ/', syllables: 2, rhyming_word: 'gracia', first_phonemes: '/ʎu/' },
    difficulty: 1,
    tags: ['meteorología', 'común'],
    sentence: 'La _____ refresca el suelo en primavera.',
    opposite: '',
    synonyms: ['precipitación', 'chubasco']
  },
  {
    id: 'es-nature-007',
    word: 'nieve',
    category: 'nature',
    language: 'es',
    image_url: '/images/words/nieve.webp',
    definition: 'Agua congelada que cae del cielo en copos blancos.',
    features: {
      category: 'fenómeno meteorológico',
      function: 'cubrir el suelo en invierno',
      location: 'montaña, zona fría, cielo',
      properties: 'es blanca, fría, suave',
      associations: 'frío, invierno, montaña, copo'
    },
    phonetic: { first_sound: '/n/', syllables: 2, rhyming_word: 'rieve', first_phonemes: '/nje/' },
    difficulty: 2,
    tags: ['meteorología', 'invierno'],
    sentence: 'La _____ cubre las montañas de blanco en invierno.',
    opposite: '',
    synonyms: ['copo', 'mantillo']
  },
  {
    id: 'es-nature-008',
    word: 'viento',
    category: 'nature',
    language: 'es',
    image_url: '/images/words/viento.webp',
    definition: 'Corriente de aire que se mueve en la atmósfera.',
    features: {
      category: 'fenómeno meteorológico',
      function: 'mover el aire',
      location: 'cielo, campo, costa',
      properties: 'es invisible, se siente, puede ser fuerte',
      associations: 'aire, tormenta, brisa, ráfaga'
    },
    phonetic: { first_sound: '/b/', syllables: 2, rhyming_word: 'ciento', first_phonemes: '/bie/' },
    difficulty: 1,
    tags: ['meteorología', 'común'],
    sentence: 'El _____ mueve las hojas de los árboles.',
    opposite: '',
    synonyms: ['brisa', 'corriente de aire']
  },
  {
    id: 'es-nature-009',
    word: 'nube',
    category: 'nature',
    language: 'es',
    image_url: '/images/words/nube.webp',
    definition: 'Masa de vapor de agua visible en el cielo.',
    features: {
      category: 'fenómeno meteorológico',
      function: 'producir lluvia',
      location: 'cielo',
      properties: 'es blanca o gris, flotante, algodonosa',
      associations: 'lluvia, cielo, tormenta, blanco'
    },
    phonetic: { first_sound: '/n/', syllables: 2, rhyming_word: 'lube', first_phonemes: '/nu/' },
    difficulty: 1,
    tags: ['meteorología', 'común'],
    sentence: 'Una _____ grande tapó el sol.',
    opposite: '',
    synonyms: ['cúmulo', 'nubarrón']
  },
  {
    id: 'es-nature-010',
    word: 'lago',
    category: 'nature',
    language: 'es',
    image_url: '/images/words/lago.webp',
    definition: 'Masa de agua rodeada de tierra.',
    features: {
      category: 'accidente geográfico',
      function: 'contener agua',
      location: 'campo, montaña, valle',
      properties: 'es de agua dulce, tranquilo, extenso',
      associations: 'agua, pez, montaña, barca'
    },
    phonetic: { first_sound: '/l/', syllables: 2, rhyming_word: 'pago', first_phonemes: '/la/' },
    difficulty: 1,
    tags: ['geografía', 'común'],
    sentence: 'El _____ refleja las montañas como un espejo.',
    opposite: '',
    synonyms: ['laguna', 'estanque']
  },
  {
    id: 'es-nature-011',
    word: 'bosque',
    category: 'nature',
    language: 'es',
    image_url: '/images/words/bosque.webp',
    definition: 'Extensión de terreno cubierta de árboles.',
    features: {
      category: 'ecosistema',
      function: 'hábitat de animales, producir oxígeno',
      location: 'campo, montaña',
      properties: 'tiene muchos árboles, sombra, humedad',
      associations: 'árbol, animal, sendero, naturaleza'
    },
    phonetic: { first_sound: '/b/', syllables: 2, rhyming_word: 'tosque', first_phonemes: '/bos/' },
    difficulty: 2,
    tags: ['ecosistema', 'común'],
    sentence: 'Paseamos por el _____ disfrutando de la naturaleza.',
    opposite: '',
    synonyms: ['selva', 'fronda']
  },
  {
    id: 'es-nature-012',
    word: 'piedra',
    category: 'nature',
    language: 'es',
    image_url: '/images/words/piedra.webp',
    definition: 'Fragmento de roca duro y sólido.',
    features: {
      category: 'mineral',
      function: 'construir, decorar',
      location: 'suelo, montaña, río',
      properties: 'es dura, sólida, pesada',
      associations: 'roca, montaña, río, dureza'
    },
    phonetic: { first_sound: '/p/', syllables: 2, rhyming_word: 'beldra', first_phonemes: '/pie/' },
    difficulty: 1,
    tags: ['mineral', 'común'],
    sentence: 'Encontré una _____ redonda y lisa en el río.',
    opposite: '',
    synonyms: ['roca', 'guijarro']
  },
  {
    id: 'es-nature-013',
    word: 'arena',
    category: 'nature',
    language: 'es',
    image_url: '/images/words/arena.webp',
    definition: 'Conjunto de partículas pequeñas de roca.',
    features: {
      category: 'material natural',
      function: 'formar playas, construir',
      location: 'playa, desierto, río',
      properties: 'es suave, granulada, dorada',
      associations: 'playa, mar, castillo, desierto'
    },
    phonetic: { first_sound: '/a/', syllables: 3, rhyming_word: 'lena', first_phonemes: '/a/' },
    difficulty: 2,
    tags: ['material', 'común'],
    sentence: 'Los niños hicieron un castillo en la _____ de la playa.',
    opposite: '',
    synonyms: ['gravilla', 'polvo']
  },
  {
    id: 'es-nature-014',
    word: 'césped',
    category: 'nature',
    language: 'es',
    image_url: '/images/words/cesped.webp',
    definition: 'Capa de hierba densa que cubre el suelo.',
    features: {
      category: 'planta',
      function: 'decorar, cubrir suelo',
      location: 'jardín, parque, campo',
      properties: 'es verde, suave, corto',
      associations: 'jardín, hierba, verde, parque'
    },
    phonetic: { first_sound: '/θ/', syllables: 2, rhyming_word: 'ped', first_phonemes: '/θes/' },
    difficulty: 2,
    tags: ['planta', 'jardín'],
    sentence: 'El _____ del parque está muy verde y cuidado.',
    opposite: '',
    synonyms: ['hierba', 'pasto']
  },
  {
    id: 'es-nature-015',
    word: 'hierba',
    category: 'nature',
    language: 'es',
    image_url: '/images/words/hierba.webp',
    definition: 'Planta pequeña de tallo verde que crece en el suelo.',
    features: {
      category: 'planta',
      function: 'alimentación animal, cubrir suelo',
      location: 'campo, jardín, prado',
      properties: 'es verde, pequeña, flexible',
      associations: 'prado, verde, campo, césped'
    },
    phonetic: { first_sound: '/ʎ/', syllables: 2, rhyming_word: 'sierva', first_phonemes: '/ʎe/' },
    difficulty: 1,
    tags: ['planta', 'común'],
    sentence: 'Las ovejas pastan la _____ del prado.',
    opposite: '',
    synonyms: ['pasto', 'grama']
  },

  // ==========================================
  // FAMILY (14 words)
  // ==========================================
  {
    id: 'es-family-001',
    word: 'madre',
    category: 'family',
    language: 'es',
    image_url: '/images/words/madre.webp',
    definition: 'Mujer que ha tenido hijos.',
    features: {
      category: 'familiar',
      function: 'cuidar, educar',
      location: 'hogar',
      properties: 'es femenina, progenitora',
      associations: 'padre, hijo, hogar, amor'
    },
    phonetic: { first_sound: '/m/', syllables: 2, rhyming_word: 'padre', first_phonemes: '/ma/' },
    difficulty: 1,
    tags: ['familia', 'común'],
    sentence: 'Mi _____ cocina la mejor sopa del mundo.',
    opposite: '',
    synonyms: ['mamá', 'progenitora']
  },
  {
    id: 'es-family-002',
    word: 'padre',
    category: 'family',
    language: 'es',
    image_url: '/images/words/padre.webp',
    definition: 'Hombre que ha tenido hijos.',
    features: {
      category: 'familiar',
      function: 'cuidar, proveer',
      location: 'hogar',
      properties: 'es masculino, progenitor',
      associations: 'madre, hijo, familia, hogar'
    },
    phonetic: { first_sound: '/p/', syllables: 2, rhyming_word: 'cuadre', first_phonemes: '/pa/' },
    difficulty: 1,
    tags: ['familia', 'común'],
    sentence: 'Mi _____ me enseñó a montar en bicicleta.',
    opposite: '',
    synonyms: ['papá', 'progenitor']
  },
  {
    id: 'es-family-003',
    word: 'hijo',
    category: 'family',
    language: 'es',
    image_url: '/images/words/hijo.webp',
    definition: 'Persona respecto de sus padres.',
    features: {
      category: 'familiar',
      function: 'miembro de la familia',
      location: 'hogar',
      properties: 'es descendiente masculino',
      associations: 'padre, madre, familia, niño'
    },
    phonetic: { first_sound: '/i/', syllables: 2, rhyming_word: 'fijo', first_phonemes: '/i/' },
    difficulty: 1,
    tags: ['familia', 'común'],
    sentence: 'El _____ mayor ayuda a cuidar a sus hermanos.',
    opposite: '',
    synonyms: ['vástago', 'descendiente']
  },
  {
    id: 'es-family-004',
    word: 'hija',
    category: 'family',
    language: 'es',
    image_url: '/images/words/hija.webp',
    definition: 'Persona de género femenino respecto de sus padres.',
    features: {
      category: 'familiar',
      function: 'miembro de la familia',
      location: 'hogar',
      properties: 'es descendiente femenina',
      associations: 'padre, madre, familia, niña'
    },
    phonetic: { first_sound: '/i/', syllables: 2, rhyming_word: 'lija', first_phonemes: '/i/' },
    difficulty: 1,
    tags: ['familia', 'común'],
    sentence: 'Su _____ estudia medicina en la universidad.',
    opposite: '',
    synonyms: ['vástaga', 'descendiente']
  },
  {
    id: 'es-family-005',
    word: 'hermano',
    category: 'family',
    language: 'es',
    image_url: '/images/words/hermano.webp',
    definition: 'Persona que tiene los mismos padres que otra.',
    features: {
      category: 'familiar',
      function: 'compañero de familia',
      location: 'hogar',
      properties: 'comparte padres, es masculino',
      associations: 'hermana, familia, infancia, juego'
    },
    phonetic: { first_sound: '/e/', syllables: 3, rhyming_word: 'gano', first_phonemes: '/e/' },
    difficulty: 1,
    tags: ['familia', 'común'],
    sentence: 'Mi _____ mayor vive en otra ciudad.',
    opposite: '',
    synonyms: ['hermano', 'sibling']
  },
  {
    id: 'es-family-006',
    word: 'hermana',
    category: 'family',
    language: 'es',
    image_url: '/images/words/hermana.webp',
    definition: 'Mujer que tiene los mismos padres que otra persona.',
    features: {
      category: 'familiar',
      function: 'compañera de familia',
      location: 'hogar',
      properties: 'comparte padres, es femenina',
      associations: 'hermano, familia, infancia, juego'
    },
    phonetic: { first_sound: '/e/', syllables: 3, rhyming_word: 'mana', first_phonemes: '/e/' },
    difficulty: 1,
    tags: ['familia', 'común'],
    sentence: 'Mi _____ y yo compartimos la habitación.',
    opposite: '',
    synonyms: ['hermana']
  },
  {
    id: 'es-family-007',
    word: 'abuelo',
    category: 'family',
    language: 'es',
    image_url: '/images/words/abuelo.webp',
    definition: 'Padre de los padres de una persona.',
    features: {
      category: 'familiar',
      function: 'miembro mayor de la familia',
      location: 'hogar',
      properties: 'es mayor, sabio, experiencia',
      associations: 'abuela, nieto, sabiduría, anciano'
    },
    phonetic: { first_sound: '/a/', syllables: 3, rhyming_word: 'pelo', first_phonemes: '/a/' },
    difficulty: 1,
    tags: ['familia', 'común'],
    sentence: 'Mi _____ me cuenta historias de cuando era joven.',
    opposite: '',
    synonyms: ['abuelito', 'yayo']
  },
  {
    id: 'es-family-008',
    word: 'abuela',
    category: 'family',
    language: 'es',
    image_url: '/images/words/abuela.webp',
    definition: 'Madre de los padres de una persona.',
    features: {
      category: 'familiar',
      function: 'miembro mayor de la familia',
      location: 'hogar',
      properties: 'es mayor, cariñosa, experiencia',
      associations: 'abuelo, nieta, cocina, cariño'
    },
    phonetic: { first_sound: '/a/', syllables: 3, rhyming_word: 'muela', first_phonemes: '/a/' },
    difficulty: 1,
    tags: ['familia', 'común'],
    sentence: 'Mi _____ hace las mejores empanadas.',
    opposite: '',
    synonyms: ['abuelita', 'yaya']
  },
  {
    id: 'es-family-009',
    word: 'tío',
    category: 'family',
    language: 'es',
    image_url: '/images/words/tio.webp',
    definition: 'Hermano de los padres de una persona.',
    features: {
      category: 'familiar',
      function: 'miembro de la familia extendida',
      location: 'hogar',
      properties: 'es hermano de padre o madre',
      associations: 'tía, primo, sobrino, familia'
    },
    phonetic: { first_sound: '/t/', syllables: 2, rhyming_word: 'río', first_phonemes: '/ti/' },
    difficulty: 1,
    tags: ['familia', 'común'],
    sentence: 'Mi _____ vive en el campo y tiene una granja.',
    opposite: '',
    synonyms: ['tío']
  },
  {
    id: 'es-family-010',
    word: 'tía',
    category: 'family',
    language: 'es',
    image_url: '/images/words/tia.webp',
    definition: 'Hermana de los padres de una persona.',
    features: {
      category: 'familiar',
      function: 'miembro de la familia extendida',
      location: 'hogar',
      properties: 'es hermana de padre o madre',
      associations: 'tío, prima, sobrina, familia'
    },
    phonetic: { first_sound: '/t/', syllables: 2, rhyming_word: 'pía', first_phonemes: '/ti/' },
    difficulty: 1,
    tags: ['familia', 'común'],
    sentence: 'Mi _____ me trajo un regalo de su viaje.',
    opposite: '',
    synonyms: ['tía']
  },
  {
    id: 'es-family-011',
    word: 'primo',
    category: 'family',
    language: 'es',
    image_url: '/images/words/primo.webp',
    definition: 'Hijo de los tíos de una persona.',
    features: {
      category: 'familiar',
      function: 'miembro de la familia extendida',
      location: 'hogar',
      properties: 'es hijo de tíos',
      associations: 'prima, tío, infancia, juego'
    },
    phonetic: { first_sound: '/p/', syllables: 2, rhyming_word: 'rimo', first_phonemes: '/pri/' },
    difficulty: 1,
    tags: ['familia', 'común'],
    sentence: 'Juego con mi _____ en las fiestas familiares.',
    opposite: '',
    synonyms: ['primo hermano']
  },
  {
    id: 'es-family-012',
    word: 'esposo',
    category: 'family',
    language: 'es',
    image_url: '/images/words/esposo.webp',
    definition: 'Hombre casado respecto de su esposa.',
    features: {
      category: 'familiar',
      function: 'compañero de matrimonio',
      location: 'hogar',
      properties: 'es masculino, casado',
      associations: 'esposa, boda, matrimonio, hogar'
    },
    phonetic: { first_sound: '/e/', syllables: 3, rhyming_word: 'proposo', first_phonemes: '/es/' },
    difficulty: 2,
    tags: ['familia', 'pareja'],
    sentence: 'Su _____ trabaja como ingeniero.',
    opposite: '',
    synonyms: ['marido', 'cónyuge']
  },
  {
    id: 'es-family-013',
    word: 'esposa',
    category: 'family',
    language: 'es',
    image_url: '/images/words/esposa.webp',
    definition: 'Mujer casada respecto de su esposo.',
    features: {
      category: 'familiar',
      function: 'compañera de matrimonio',
      location: 'hogar',
      properties: 'es femenina, casada',
      associations: 'esposo, boda, matrimonio, hogar'
    },
    phonetic: { first_sound: '/e/', syllables: 3, rhyming_word: 'cosa', first_phonemes: '/es/' },
    difficulty: 2,
    tags: ['familia', 'pareja'],
    sentence: 'Su _____ es profesora en la escuela del pueblo.',
    opposite: '',
    synonyms: ['mujer', 'cónyuge']
  },
  {
    id: 'es-family-014',
    word: 'bebé',
    category: 'family',
    language: 'es',
    image_url: '/images/words/bebe.webp',
    definition: 'Niño o niña de muy corta edad.',
    features: {
      category: 'familiar',
      function: 'nuevo miembro de la familia',
      location: 'hogar',
      properties: 'es muy pequeño, llora, gatea',
      associations: 'biberón, pañal, cuna, leche'
    },
    phonetic: { first_sound: '/b/', syllables: 2, rhyming_word: 'pé', first_phonemes: '/be/' },
    difficulty: 1,
    tags: ['familia', 'común'],
    sentence: 'El _____ de mi hermana ya empieza a gatear.',
    opposite: '',
    synonyms: ['recién nacido', 'infante', 'guagua']
  },

  // ==========================================
  // WEATHER (10 words)
  // ==========================================
  {
    id: 'es-weather-001',
    word: 'tormenta',
    category: 'weather',
    language: 'es',
    image_url: '/images/words/tormenta.webp',
    definition: 'Fenómeno atmosférico violento con lluvia, viento y rayos.',
    features: {
      category: 'fenómeno meteorológico',
      function: 'descarga eléctrica, lluvia intensa',
      location: 'cielo',
      properties: 'es violenta, tiene rayos, truenos',
      associations: 'rayo, trueno, lluvia, viento'
    },
    phonetic: { first_sound: '/t/', syllables: 3, rhyming_word: 'menta', first_phonemes: '/to/' },
    difficulty: 2,
    tags: ['meteorología', 'severo'],
    sentence: 'La _____ dejó sin luz a todo el barrio.',
    opposite: '',
    synonyms: ['tempestad', 'borrasca']
  },
  {
    id: 'es-weather-002',
    word: 'niebla',
    category: 'weather',
    language: 'es',
    image_url: '/images/words/niebla.webp',
    definition: 'Nube baja que reduce la visibilidad cerca del suelo.',
    features: {
      category: 'fenómeno meteorológico',
      function: 'reducir visibilidad',
      location: 'campo, ciudad, montaña',
      properties: 'es blanca, espesa, dificulta ver',
      associations: 'nube, visibilidad, frío, humedad'
    },
    phonetic: { first_sound: '/n/', syllables: 2, rhyming_word: 'muebla', first_phonemes: '/nje/' },
    difficulty: 2,
    tags: ['meteorología'],
    sentence: 'Esta mañana había mucha _____ y no se veía nada.',
    opposite: '',
    synonyms: ['neblina', 'bruma']
  },
  {
    id: 'es-weather-003',
    word: 'arcoíris',
    category: 'weather',
    language: 'es',
    image_url: '/images/words/arcoiris.webp',
    definition: 'Arco de colores que aparece en el cielo tras la lluvia.',
    features: {
      category: 'fenómeno óptico',
      function: 'decoration del cielo',
      location: 'cielo',
      properties: 'tiene siete colores, forma de arco',
      associations: 'lluvia, sol, colores, cielo'
    },
    phonetic: { first_sound: '/a/', syllables: 3, rhyming_word: 'iris', first_phonemes: '/a/' },
    difficulty: 3,
    tags: ['meteorología', 'fenómeno'],
    sentence: 'Después de la lluvia apareció un _____ en el cielo.',
    opposite: '',
    synonyms: ['arco iris']
  },
  {
    id: 'es-weather-004',
    word: 'calor',
    category: 'weather',
    language: 'es',
    image_url: '/images/words/calor.webp',
    definition: 'Sensación de temperatura alta en el ambiente.',
    features: {
      category: 'condición climática',
      function: 'describir temperatura alta',
      location: 'exterior, ambiente',
      properties: 'es una sensación, sudor, sofoco',
      associations: 'verano, sol, sudor, playa'
    },
    phonetic: { first_sound: '/k/', syllables: 2, rhyming_word: 'valor', first_phonemes: '/ka/' },
    difficulty: 1,
    tags: ['meteorología', 'temperatura', 'común'],
    sentence: 'Hoy hace mucho _____, voy a ir a la piscina.',
    opposite: 'frío',
    synonyms: ['bochorno', 'sofoco']
  },
  {
    id: 'es-weather-005',
    word: 'frío',
    category: 'weather',
    language: 'es',
    image_url: '/images/words/frio.webp',
    definition: 'Sensación de temperatura baja en el ambiente.',
    features: {
      category: 'condición climática',
      function: 'describir temperatura baja',
      location: 'exterior, ambiente',
      properties: 'es una sensación, escalofrío, tiritar',
      associations: 'invierno, nieve, abrigo, calefacción'
    },
    phonetic: { first_sound: '/f/', syllables: 2, rhyming_word: 'mío', first_phonemes: '/fri/' },
    difficulty: 1,
    tags: ['meteorología', 'temperatura', 'común'],
    sentence: 'En invierno hace mucho _____ y necesitamos abrigo.',
    opposite: 'calor',
    synonyms: ['gelidez', 'hielo']
  },
  {
    id: 'es-weather-006',
    word: 'granizo',
    category: 'weather',
    language: 'es',
    image_url: '/images/words/granizo.webp',
    definition: 'Precipitación de bolitas de hielo.',
    features: {
      category: 'fenómeno meteorológico',
      function: 'precipitación helada',
      location: 'cielo, suelo',
      properties: 'son bolitas de hielo, golpean fuerte',
      associations: 'tormenta, hielo, golpe, frío'
    },
    phonetic: { first_sound: '/g/', syllables: 3, rhyming_word: 'izo', first_phonemes: '/gra/' },
    difficulty: 3,
    tags: ['meteorología', 'severo'],
    sentence: 'Cayó _____ del tamaño de pelotas de golf.',
    opposite: '',
    synonyms: ['pedrisco']
  },
  {
    id: 'es-weather-007',
    word: 'trueno',
    category: 'weather',
    language: 'es',
    image_url: '/images/words/trueno.webp',
    definition: 'Ruido fuerte producido por una descarga eléctrica.',
    features: {
      category: 'fenómeno meteorológico',
      function: 'sonido de tormenta',
      location: 'cielo',
      properties: 'es un sonido fuerte, retumba',
      associations: 'rayo, tormenta, relámpago, miedo'
    },
    phonetic: { first_sound: '/t/', syllables: 2, rhyming_word: 'eno', first_phonemes: '/tru/' },
    difficulty: 2,
    tags: ['meteorología', 'tormenta'],
    sentence: 'El _____ sonó tan fuerte que me asusté.',
    opposite: '',
    synonyms: ['estampido', 'retumbar']
  },
  {
    id: 'es-weather-008',
    word: 'relámpago',
    category: 'weather',
    language: 'es',
    image_url: '/images/words/relampago.webp',
    definition: 'Destello de luz en el cielo durante una tormenta.',
    features: {
      category: 'fenómeno meteorológico',
      function: 'luz de tormenta',
      location: 'cielo',
      properties: 'es un destello rápido, brillante',
      associations: 'rayo, trueno, tormenta, luz'
    },
    phonetic: { first_sound: '/r/', syllables: 4, rhyming_word: 'pago', first_phonemes: '/re/' },
    difficulty: 4,
    tags: ['meteorología', 'tormenta'],
    sentence: 'El _____ iluminó todo el cielo por un instante.',
    opposite: '',
    synonyms: ['rayo', 'fulgor']
  },
  {
    id: 'es-weather-009',
    word: 'brisa',
    category: 'weather',
    language: 'es',
    image_url: '/images/words/brisa.webp',
    definition: 'Viento suave y agradable.',
    features: {
      category: 'fenómeno meteorológico',
      function: 'ventilar suavemente',
      location: 'costa, campo, jardín',
      properties: 'es suave, agradable, fresca',
      associations: 'mar, suave, fresco, playa'
    },
    phonetic: { first_sound: '/b/', syllables: 2, rhyming_word: 'risa', first_phonemes: '/bri/' },
    difficulty: 2,
    tags: ['meteorología', 'suave'],
    sentence: 'La _____ del mar es muy agradable al atardecer.',
    opposite: '',
    synonyms: ['vientecillo', 'aura']
  },
  {
    id: 'es-weather-010',
    word: 'humedad',
    category: 'weather',
    language: 'es',
    image_url: '/images/words/humedad.webp',
    definition: 'Cantidad de vapor de agua presente en el aire.',
    features: {
      category: 'condición climática',
      function: 'describir vapor de agua en el aire',
      location: 'ambiente',
      properties: 'es invisible, se siente pegajosa',
      associations: 'lluvia, sudor, neblina, bochorno'
    },
    phonetic: { first_sound: '/u/', syllables: 3, rhyming_word: 'edad', first_phonemes: '/u/' },
    difficulty: 3,
    tags: ['meteorología'],
    sentence: 'Hoy hay mucha _____ y se siente pegajoso.',
    opposite: '',
    synonyms: ['vapor', 'mojadura']
  }
];
