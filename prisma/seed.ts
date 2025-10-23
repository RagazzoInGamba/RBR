import { PrismaClient, RecipeCategory, MealType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============= USERS =============
  const hashedPassword = await bcrypt.hash('Admin123!', 12);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@redbullracing.com' },
    update: {},
    create: {
      email: 'admin@redbullracing.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      firstName: 'System',
      lastName: 'Administrator',
    },
  });
  console.log('✅ Created Super Admin:', superAdmin.email);

  const kitchenAdmin = await prisma.user.upsert({
    where: { email: 'chef@redbullracing.com' },
    update: {},
    create: {
      email: 'chef@redbullracing.com',
      password: await bcrypt.hash('Chef123!', 12),
      role: 'KITCHEN_ADMIN',
      firstName: 'Head',
      lastName: 'Chef',
    },
  });
  console.log('✅ Created Kitchen Admin:', kitchenAdmin.email);

  const customerAdmin = await prisma.user.upsert({
    where: { email: 'manager@redbullracing.com' },
    update: {},
    create: {
      email: 'manager@redbullracing.com',
      password: await bcrypt.hash('Manager123!', 12),
      role: 'CUSTOMER_ADMIN',
      firstName: 'Team',
      lastName: 'Manager',
    },
  });
  console.log('✅ Created Customer Admin:', customerAdmin.email);

  const endUser = await prisma.user.upsert({
    where: { email: 'driver@redbullracing.com' },
    update: {},
    create: {
      email: 'driver@redbullracing.com',
      password: await bcrypt.hash('Driver123!', 12),
      role: 'END_USER',
      firstName: 'Max',
      lastName: 'Verstappen',
      department: 'Racing Team',
    },
  });
  console.log('✅ Created End User:', endUser.email);

  // Additional Users for testing
  const additionalUsers = [
    { email: 'sergio@redbullracing.com', firstName: 'Sergio', lastName: 'Perez', role: 'END_USER', department: 'Racing Team', password: 'Sergio123!' },
    { email: 'christian.horner@redbullracing.com', firstName: 'Christian', lastName: 'Horner', role: 'CUSTOMER_ADMIN', department: 'Management', password: 'Christian123!' },
    { email: 'adrian.newey@redbullracing.com', firstName: 'Adrian', lastName: 'Newey', role: 'CUSTOMER_ADMIN', department: 'Engineering', password: 'Adrian123!' },
    { email: 'engineer1@redbullracing.com', firstName: 'James', lastName: 'Smith', role: 'END_USER', department: 'Engineering', password: 'James123!' },
    { email: 'engineer2@redbullracing.com', firstName: 'Sarah', lastName: 'Johnson', role: 'END_USER', department: 'Engineering', password: 'Sarah123!' },
    { email: 'mechanic1@redbullracing.com', firstName: 'Marco', lastName: 'Rossi', role: 'END_USER', department: 'Mechanics', password: 'Marco123!' },
    { email: 'mechanic2@redbullracing.com', firstName: 'Luigi', lastName: 'Bianchi', role: 'END_USER', department: 'Mechanics', password: 'Luigi123!' },
    { email: 'kitchen.staff@redbullracing.com', firstName: 'Paolo', lastName: 'Verdi', role: 'KITCHEN_ADMIN', department: 'Kitchen', password: 'Paolo123!' },
    { email: 'sous.chef@redbullracing.com', firstName: 'Maria', lastName: 'Ferrari', role: 'KITCHEN_ADMIN', department: 'Kitchen', password: 'Maria123!' },
    { email: 'marketing@redbullracing.com', firstName: 'Emma', lastName: 'Brown', role: 'END_USER', department: 'Marketing', password: 'Emma123!' },
    { email: 'pr@redbullracing.com', firstName: 'Oliver', lastName: 'Wilson', role: 'END_USER', department: 'Public Relations', password: 'Oliver123!' },
  ];

  const createdUsers = [superAdmin, kitchenAdmin, customerAdmin, endUser];
  for (const userData of additionalUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        password: await bcrypt.hash(userData.password, 12),
        role: userData.role as any,
        firstName: userData.firstName,
        lastName: userData.lastName,
        department: userData.department,
      },
    });
    createdUsers.push(user);
    console.log(`✅ Created ${userData.role}: ${user.email}`);
  }

  console.log(`\n✅ Total users created: ${createdUsers.length}`);

  // ============= PAYMENT GATEWAYS =============
  const gateways: Array<{ gateway: 'NEXY' | 'SATISPAY'; env: 'SANDBOX' | 'PRODUCTION' }> = [
    { gateway: 'NEXY', env: 'SANDBOX' },
    { gateway: 'SATISPAY', env: 'SANDBOX' },
  ];

  for (const { gateway, env } of gateways) {
    await prisma.paymentGatewayConfig.upsert({
      where: {
        gateway_environment: {
          gateway,
          environment: env,
        },
      },
      update: {},
      create: {
        gateway,
        environment: env,
        isActive: false,
        credentials: {},
        debugMode: true,
      },
    });
    console.log(`✅ Created ${gateway} ${env} gateway config`);
  }

  // ============= BOOKING RULES =============
  console.log('');
  console.log('📋 Creating booking rules...');
  
  const bookingRules = [
    // LUNCH Rules
    { mealType: 'LUNCH', category: 'APPETIZER', minQuantity: 0, maxQuantity: 1, isRequired: false },
    { mealType: 'LUNCH', category: 'FIRST_COURSE', minQuantity: 1, maxQuantity: 1, isRequired: true },
    { mealType: 'LUNCH', category: 'SECOND_COURSE', minQuantity: 0, maxQuantity: 1, isRequired: false },
    { mealType: 'LUNCH', category: 'SIDE_DISH', minQuantity: 0, maxQuantity: 2, isRequired: false },
    { mealType: 'LUNCH', category: 'DESSERT', minQuantity: 0, maxQuantity: 1, isRequired: false },
    { mealType: 'LUNCH', category: 'BEVERAGE', minQuantity: 1, maxQuantity: 2, isRequired: true },
    
    // DINNER Rules  
    { mealType: 'DINNER', category: 'APPETIZER', minQuantity: 0, maxQuantity: 1, isRequired: false },
    { mealType: 'DINNER', category: 'FIRST_COURSE', minQuantity: 0, maxQuantity: 1, isRequired: false },
    { mealType: 'DINNER', category: 'SECOND_COURSE', minQuantity: 1, maxQuantity: 1, isRequired: true },
    { mealType: 'DINNER', category: 'SIDE_DISH', minQuantity: 1, maxQuantity: 2, isRequired: true },
    { mealType: 'DINNER', category: 'DESSERT', minQuantity: 0, maxQuantity: 1, isRequired: false },
    { mealType: 'DINNER', category: 'BEVERAGE', minQuantity: 1, maxQuantity: 2, isRequired: true },
    
    // BREAKFAST Rules
    { mealType: 'BREAKFAST', category: 'APPETIZER', minQuantity: 1, maxQuantity: 2, isRequired: true },
    { mealType: 'BREAKFAST', category: 'DESSERT', minQuantity: 0, maxQuantity: 2, isRequired: false },
    { mealType: 'BREAKFAST', category: 'BEVERAGE', minQuantity: 1, maxQuantity: 3, isRequired: true },
  ];

  for (const rule of bookingRules) {
    await prisma.bookingRule.upsert({
      where: {
        mealType_category: {
          mealType: rule.mealType as MealType,
          category: rule.category as RecipeCategory,
        },
      },
      update: {},
      create: {
        mealType: rule.mealType as MealType,
        category: rule.category as RecipeCategory,
        minQuantity: rule.minQuantity,
        maxQuantity: rule.maxQuantity,
        isRequired: rule.isRequired,
        isActive: true,
      },
    });
  }
  console.log(`✅ Created ${bookingRules.length} booking rules`);

  // ============= RECIPES =============
  console.log('');
  console.log('👨‍🍳 Creating recipes...');
  
  const recipes = [
    // APPETIZERS
    {
      name: 'Bruschetta al Pomodoro',
      description: 'Pane tostato con pomodori freschi, basilico e olio extravergine',
      category: 'APPETIZER',
      ingredients: [
        { name: 'Pane casereccio', quantity: 4, unit: 'fette' },
        { name: 'Pomodori maturi', quantity: 200, unit: 'g' },
        { name: 'Basilico fresco', quantity: 10, unit: 'foglie' },
        { name: 'Olio EVO', quantity: 2, unit: 'cucchiai' },
      ],
      instructions: 'Tostare il pane, sfregare con aglio, condire con pomodori freschi a dadini, basilico e olio EVO.',
      prepTime: 10,
      cookTime: 5,
      servings: 1,
      calories: 180,
      allergens: ['glutine'],
      isAvailable: true,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: false,
    },
    {
      name: 'Caprese',
      description: 'Mozzarella di bufala, pomodoro, basilico e olio EVO',
      category: 'APPETIZER',
      ingredients: [
        { name: 'Mozzarella di bufala', quantity: 125, unit: 'g' },
        { name: 'Pomodoro', quantity: 150, unit: 'g' },
        { name: 'Basilico', quantity: 5, unit: 'foglie' },
        { name: 'Olio EVO', quantity: 1, unit: 'cucchiaio' },
      ],
      instructions: 'Affettare mozzarella e pomodoro, alternare, condire con basilico, sale e olio EVO.',
      prepTime: 5,
      cookTime: 0,
      servings: 1,
      calories: 250,
      allergens: ['lattosio'],
      isAvailable: true,
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: true,
    },
    
    // FIRST COURSES
    {
      name: 'Pasta Carbonara',
      description: 'Pasta con guanciale, uova, pecorino romano e pepe nero',
      category: 'FIRST_COURSE',
      ingredients: [
        { name: 'Spaghetti', quantity: 100, unit: 'g' },
        { name: 'Guanciale', quantity: 50, unit: 'g' },
        { name: 'Uova', quantity: 2, unit: 'pz' },
        { name: 'Pecorino romano', quantity: 30, unit: 'g' },
        { name: 'Pepe nero', quantity: 1, unit: 'pizzico' },
      ],
      instructions: 'Cuocere la pasta, rosolare il guanciale, mantecare con uova e pecorino fuori dal fuoco.',
      prepTime: 10,
      cookTime: 15,
      servings: 1,
      calories: 520,
      allergens: ['glutine', 'uova', 'lattosio'],
      isAvailable: true,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
    },
    {
      name: 'Risotto ai Funghi Porcini',
      description: 'Risotto cremoso con funghi porcini freschi',
      category: 'FIRST_COURSE',
      ingredients: [
        { name: 'Riso Carnaroli', quantity: 80, unit: 'g' },
        { name: 'Funghi porcini', quantity: 100, unit: 'g' },
        { name: 'Brodo vegetale', quantity: 500, unit: 'ml' },
        { name: 'Parmigiano', quantity: 20, unit: 'g' },
        { name: 'Burro', quantity: 10, unit: 'g' },
      ],
      instructions: 'Tostare il riso, aggiungere brodo gradualmente, incorporare funghi saltati, mantecare con burro e parmigiano.',
      prepTime: 10,
      cookTime: 20,
      servings: 1,
      calories: 380,
      allergens: ['lattosio'],
      isAvailable: true,
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: true,
    },
    {
      name: 'Penne all\'Arrabbiata',
      description: 'Penne con pomodoro, aglio, peperoncino e prezzemolo',
      category: 'FIRST_COURSE',
      ingredients: [
        { name: 'Penne rigate', quantity: 100, unit: 'g' },
        { name: 'Pomodori pelati', quantity: 200, unit: 'g' },
        { name: 'Aglio', quantity: 1, unit: 'spicchio' },
        { name: 'Peperoncino', quantity: 1, unit: 'pz' },
        { name: 'Prezzemolo', quantity: 5, unit: 'g' },
      ],
      instructions: 'Soffriggere aglio e peperoncino, aggiungere pomodoro, cuocere pasta e mantecare.',
      prepTime: 5,
      cookTime: 15,
      servings: 1,
      calories: 340,
      allergens: ['glutine'],
      isAvailable: true,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: false,
    },
    {
      name: 'Lasagne alla Bolognese',
      description: 'Lasagne al forno con ragù, besciamella e parmigiano',
      category: 'FIRST_COURSE',
      ingredients: [
        { name: 'Sfoglia lasagne', quantity: 100, unit: 'g' },
        { name: 'Ragù bolognese', quantity: 150, unit: 'g' },
        { name: 'Besciamella', quantity: 100, unit: 'g' },
        { name: 'Parmigiano', quantity: 30, unit: 'g' },
      ],
      instructions: 'Stratificare sfoglia, ragù e besciamella, gratinare con parmigiano in forno a 180°C per 25 minuti.',
      prepTime: 20,
      cookTime: 25,
      servings: 1,
      calories: 580,
      allergens: ['glutine', 'lattosio'],
      isAvailable: true,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
    },
    
    // SECOND COURSES
    {
      name: 'Pollo alla Griglia',
      description: 'Petto di pollo marinato e grigliato con erbe aromatiche',
      category: 'SECOND_COURSE',
      ingredients: [
        { name: 'Petto di pollo', quantity: 200, unit: 'g' },
        { name: 'Rosmarino', quantity: 2, unit: 'rametti' },
        { name: 'Limone', quantity: 0.5, unit: 'pz' },
        { name: 'Olio EVO', quantity: 1, unit: 'cucchiaio' },
      ],
      instructions: 'Marinare il pollo con olio, limone e rosmarino. Grigliare 5-6 minuti per lato.',
      prepTime: 15,
      cookTime: 12,
      servings: 1,
      calories: 280,
      allergens: [],
      isAvailable: true,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: true,
    },
    {
      name: 'Salmone al Forno con Limone',
      description: 'Filetto di salmone al forno con limone e aneto',
      category: 'SECOND_COURSE',
      ingredients: [
        { name: 'Filetto di salmone', quantity: 180, unit: 'g' },
        { name: 'Limone', quantity: 0.5, unit: 'pz' },
        { name: 'Aneto fresco', quantity: 5, unit: 'g' },
        { name: 'Olio EVO', quantity: 1, unit: 'cucchiaio' },
      ],
      instructions: 'Condire il salmone con limone, aneto e olio. Cuocere in forno a 180°C per 15 minuti.',
      prepTime: 5,
      cookTime: 15,
      servings: 1,
      calories: 320,
      allergens: ['pesce'],
      isAvailable: true,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: true,
    },
    {
      name: 'Hamburger Vegetariano',
      description: 'Burger di legumi con verdure grigliate',
      category: 'SECOND_COURSE',
      ingredients: [
        { name: 'Burger di legumi', quantity: 150, unit: 'g' },
        { name: 'Verdure grigliate', quantity: 100, unit: 'g' },
        { name: 'Insalata', quantity: 30, unit: 'g' },
        { name: 'Pomodoro', quantity: 50, unit: 'g' },
      ],
      instructions: 'Grigliare il burger vegetale, servire con verdure grigliate e insalata fresca.',
      prepTime: 5,
      cookTime: 10,
      servings: 1,
      calories: 240,
      allergens: ['soia'],
      isAvailable: true,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
    },
    
    // SIDE DISHES
    {
      name: 'Insalata Mista',
      description: 'Lattuga, pomodori, cetrioli e carote con olio e aceto',
      category: 'SIDE_DISH',
      ingredients: [
        { name: 'Lattuga', quantity: 80, unit: 'g' },
        { name: 'Pomodori ciliegino', quantity: 50, unit: 'g' },
        { name: 'Cetrioli', quantity: 40, unit: 'g' },
        { name: 'Carote', quantity: 30, unit: 'g' },
      ],
      instructions: 'Lavare e tagliare le verdure, condire con olio EVO, aceto e sale.',
      prepTime: 10,
      cookTime: 0,
      servings: 1,
      calories: 60,
      allergens: [],
      isAvailable: true,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
    },
    {
      name: 'Patate al Forno',
      description: 'Patate novelle al forno con rosmarino',
      category: 'SIDE_DISH',
      ingredients: [
        { name: 'Patate novelle', quantity: 200, unit: 'g' },
        { name: 'Rosmarino', quantity: 2, unit: 'rametti' },
        { name: 'Olio EVO', quantity: 1, unit: 'cucchiaio' },
        { name: 'Sale grosso', quantity: 1, unit: 'pizzico' },
      ],
      instructions: 'Tagliare le patate, condire con olio, rosmarino e sale. Cuocere in forno a 200°C per 30 minuti.',
      prepTime: 10,
      cookTime: 30,
      servings: 1,
      calories: 180,
      allergens: [],
      isAvailable: true,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
    },
    {
      name: 'Spinaci Saltati',
      description: 'Spinaci freschi saltati in padella con aglio',
      category: 'SIDE_DISH',
      ingredients: [
        { name: 'Spinaci freschi', quantity: 200, unit: 'g' },
        { name: 'Aglio', quantity: 1, unit: 'spicchio' },
        { name: 'Olio EVO', quantity: 1, unit: 'cucchiaio' },
      ],
      instructions: 'Saltare gli spinaci in padella con aglio e olio per 5 minuti.',
      prepTime: 5,
      cookTime: 5,
      servings: 1,
      calories: 80,
      allergens: [],
      isAvailable: true,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
    },
    
    // DESSERTS
    {
      name: 'Tiramisù Classico',
      description: 'Dolce al cucchiaio con savoiardi, mascarpone e caffè',
      category: 'DESSERT',
      ingredients: [
        { name: 'Savoiardi', quantity: 100, unit: 'g' },
        { name: 'Mascarpone', quantity: 125, unit: 'g' },
        { name: 'Uova', quantity: 2, unit: 'pz' },
        { name: 'Caffè', quantity: 100, unit: 'ml' },
        { name: 'Cacao amaro', quantity: 10, unit: 'g' },
      ],
      instructions: 'Montare tuorli e zucchero, incorporare mascarpone. Bagnare savoiardi nel caffè, stratificare, spolverare con cacao.',
      prepTime: 20,
      cookTime: 0,
      servings: 1,
      calories: 420,
      allergens: ['glutine', 'uova', 'lattosio'],
      isAvailable: true,
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false,
    },
    {
      name: 'Panna Cotta ai Frutti di Bosco',
      description: 'Panna cotta con coulis di frutti di bosco',
      category: 'DESSERT',
      ingredients: [
        { name: 'Panna fresca', quantity: 200, unit: 'ml' },
        { name: 'Zucchero', quantity: 30, unit: 'g' },
        { name: 'Gelatina', quantity: 2, unit: 'fogli' },
        { name: 'Frutti di bosco', quantity: 80, unit: 'g' },
      ],
      instructions: 'Scaldare panna con zucchero, aggiungere gelatina. Raffreddare in stampi, servire con coulis di frutti di bosco.',
      prepTime: 15,
      cookTime: 5,
      servings: 1,
      calories: 320,
      allergens: ['lattosio'],
      isAvailable: true,
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: true,
    },
    {
      name: 'Crostata alla Frutta',
      description: 'Crostata con crema pasticcera e frutta fresca di stagione',
      category: 'DESSERT',
      ingredients: [
        { name: 'Pasta frolla', quantity: 120, unit: 'g' },
        { name: 'Crema pasticcera', quantity: 100, unit: 'g' },
        { name: 'Frutta fresca', quantity: 80, unit: 'g' },
      ],
      instructions: 'Cuocere la base di pasta frolla, farcire con crema e decorare con frutta fresca.',
      prepTime: 15,
      cookTime: 20,
      servings: 1,
      calories: 380,
      allergens: ['glutine', 'uova', 'lattosio'],
      isAvailable: true,
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false,
    },
    
    // BEVERAGES
    {
      name: 'Acqua Naturale',
      description: 'Acqua minerale naturale 500ml',
      category: 'BEVERAGE',
      ingredients: [{ name: 'Acqua minerale', quantity: 500, unit: 'ml' }],
      instructions: 'Servire fresca.',
      prepTime: 0,
      cookTime: 0,
      servings: 1,
      calories: 0,
      allergens: [],
      isAvailable: true,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
    },
    {
      name: 'Coca Cola',
      description: 'Bibita gasata 330ml',
      category: 'BEVERAGE',
      ingredients: [{ name: 'Coca Cola', quantity: 330, unit: 'ml' }],
      instructions: 'Servire fredda.',
      prepTime: 0,
      cookTime: 0,
      servings: 1,
      calories: 140,
      allergens: [],
      isAvailable: true,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
    },
    {
      name: 'Succo d\'Arancia',
      description: 'Succo 100% arancia spremuta 250ml',
      category: 'BEVERAGE',
      ingredients: [{ name: 'Succo arancia', quantity: 250, unit: 'ml' }],
      instructions: 'Servire fresco.',
      prepTime: 0,
      cookTime: 0,
      servings: 1,
      calories: 110,
      allergens: [],
      isAvailable: true,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
    },
    {
      name: 'Caffè Espresso',
      description: 'Caffè espresso italiano',
      category: 'BEVERAGE',
      ingredients: [{ name: 'Caffè', quantity: 30, unit: 'ml' }],
      instructions: 'Preparare espresso.',
      prepTime: 0,
      cookTime: 1,
      servings: 1,
      calories: 5,
      allergens: [],
      isAvailable: true,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
    },
    // Additional recipes for variety
    {
      name: 'Vitello Tonnato',
      description: 'Fette di vitello con salsa tonnata',
      category: 'APPETIZER',
      ingredients: [
        { name: 'Vitello', quantity: 100, unit: 'g' },
        { name: 'Tonno', quantity: 50, unit: 'g' },
        { name: 'Maionese', quantity: 30, unit: 'g' },
        { name: 'Capperi', quantity: 10, unit: 'g' },
      ],
      instructions: 'Cuocere il vitello, preparare la salsa tonnata, servire freddo.',
      prepTime: 30,
      cookTime: 60,
      servings: 1,
      calories: 290,
      allergens: ['pesce', 'uova'],
      isAvailable: true,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: true,
    },
    {
      name: 'Orecchiette con Cime di Rapa',
      description: 'Pasta pugliese con cime di rapa, aglio e peperoncino',
      category: 'FIRST_COURSE',
      ingredients: [
        { name: 'Orecchiette', quantity: 100, unit: 'g' },
        { name: 'Cime di rapa', quantity: 150, unit: 'g' },
        { name: 'Aglio', quantity: 2, unit: 'spicchi' },
        { name: 'Peperoncino', quantity: 1, unit: 'pz' },
      ],
      instructions: 'Cuocere le cime di rapa, saltare con aglio e peperoncino, mantecare con la pasta.',
      prepTime: 10,
      cookTime: 15,
      servings: 1,
      calories: 350,
      allergens: ['glutine'],
      isAvailable: true,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: false,
    },
    {
      name: 'Tagliata di Manzo',
      description: 'Tagliata di manzo con rucola e grana',
      category: 'SECOND_COURSE',
      ingredients: [
        { name: 'Manzo', quantity: 250, unit: 'g' },
        { name: 'Rucola', quantity: 50, unit: 'g' },
        { name: 'Grana', quantity: 30, unit: 'g' },
        { name: 'Aceto balsamico', quantity: 1, unit: 'cucchiaio' },
      ],
      instructions: 'Grigliare la carne, tagliare a fette, servire con rucola, grana e aceto balsamico.',
      prepTime: 5,
      cookTime: 8,
      servings: 1,
      calories: 380,
      allergens: ['lattosio'],
      isAvailable: true,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: true,
    },
    {
      name: 'Broccoli al Vapore',
      description: 'Broccoli cotti al vapore con olio e limone',
      category: 'SIDE_DISH',
      ingredients: [
        { name: 'Broccoli', quantity: 200, unit: 'g' },
        { name: 'Limone', quantity: 0.5, unit: 'pz' },
        { name: 'Olio EVO', quantity: 1, unit: 'cucchiaio' },
      ],
      instructions: 'Cuocere i broccoli al vapore, condire con olio e limone.',
      prepTime: 5,
      cookTime: 10,
      servings: 1,
      calories: 70,
      allergens: [],
      isAvailable: true,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
    },
    {
      name: 'Macedonia di Frutta',
      description: 'Mix di frutta fresca di stagione',
      category: 'DESSERT',
      ingredients: [
        { name: 'Frutta mista', quantity: 200, unit: 'g' },
        { name: 'Succo di limone', quantity: 1, unit: 'cucchiaio' },
        { name: 'Zucchero', quantity: 10, unit: 'g' },
      ],
      instructions: 'Tagliare la frutta, condire con limone e zucchero.',
      prepTime: 15,
      cookTime: 0,
      servings: 1,
      calories: 120,
      allergens: [],
      isAvailable: true,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
    },
  ];

  const createdRecipes = [];
  for (const recipe of recipes) {
    const created = await prisma.recipe.create({
      data: recipe as never,
    });
    createdRecipes.push(created);
  }
  console.log(`✅ Created ${createdRecipes.length} recipes`);

  // ============= MENUS =============
  console.log('');
  console.log('📅 Creating weekly menus...');
  
  const today = new Date();
  const menus = [];
  
  // Create menus for next 5 days
  for (let i = 0; i < 5; i++) {
    const menuDate = new Date(today);
    menuDate.setDate(today.getDate() + i);
    
    // LUNCH Menu
    const lunchRecipes = {
      appetizer: createdRecipes.find(r => r.category === 'APPETIZER' && r.name.includes('Bruschetta')),
      firstCourse: createdRecipes[2 + (i % 4)], // Rotate first courses
      secondCourse: createdRecipes.find(r => r.category === 'SECOND_COURSE' && r.name.includes('Pollo')),
      sideDish: createdRecipes.find(r => r.category === 'SIDE_DISH'),
      dessert: createdRecipes[11 + (i % 3)], // Rotate desserts
      beverage: createdRecipes.find(r => r.category === 'BEVERAGE' && r.name.includes('Acqua')),
    };
    
    const lunchMenu = await prisma.menu.create({
      data: {
        name: `Menu Pranzo - ${menuDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}`,
        startDate: menuDate,
        endDate: menuDate,
        mealType: 'LUNCH',
        courses: {
          antipasto: [{ recipeId: lunchRecipes.appetizer?.id, recipeName: lunchRecipes.appetizer?.name, quantity: 1 }],
          primo: [{ recipeId: lunchRecipes.firstCourse?.id, recipeName: lunchRecipes.firstCourse?.name, quantity: 1 }],
          secondo: [{ recipeId: lunchRecipes.secondCourse?.id, recipeName: lunchRecipes.secondCourse?.name, quantity: 1 }],
          contorno: [{ recipeId: lunchRecipes.sideDish?.id, recipeName: lunchRecipes.sideDish?.name, quantity: 1 }],
          dessert: [{ recipeId: lunchRecipes.dessert?.id, recipeName: lunchRecipes.dessert?.name, quantity: 1 }],
          extra: [{ recipeId: lunchRecipes.beverage?.id, recipeName: lunchRecipes.beverage?.name, quantity: 1 }],
        },
        maxBookings: 50,
        currentBookings: 0,
        isActive: true,
        createdBy: kitchenAdmin.id,
      },
    });
    menus.push(lunchMenu);
  }
  
  console.log(`✅ Created ${menus.length} menus`);

  // ============= GROUPS =============
  console.log('');
  console.log('👥 Creating groups...');

  const groups = [
    { name: 'Racing Team', description: 'Piloti e team principal', members: [endUser.id] },
    { name: 'Engineering Team', description: 'Ingegneri e tecnici', members: [] },
    { name: 'Kitchen Staff', description: 'Personale cucina', members: [kitchenAdmin.id] },
    { name: 'Management', description: 'Direzione e amministrazione', members: [customerAdmin.id] },
    { name: 'All Staff', description: 'Tutto il personale RBR', members: [] },
  ];

  const createdGroups = [];
  for (const groupData of groups) {
    const group = await prisma.group.create({
      data: {
        name: groupData.name,
        description: groupData.description,
        isActive: true,
        createdBy: superAdmin.id,
      },
    });
    createdGroups.push(group);

    // Add members
    for (const userId of groupData.members) {
      await prisma.groupMember.create({
        data: {
          groupId: group.id,
          userId: userId,
          role: 'MEMBER',
          addedBy: superAdmin.id,
        },
      });
    }
    console.log(`✅ Created group: ${group.name}`);
  }

  // ============= SAMPLE BOOKINGS =============
  console.log('');
  console.log('📝 Creating sample bookings...');

  // Create bookings for different users and statuses
  const bookingData = [
    { user: endUser, menu: menus[0], status: 'CONFIRMED' as const, paymentStatus: 'COMPLETED' as const },
    { user: endUser, menu: menus[1], status: 'PENDING' as const, paymentStatus: 'PENDING' as const },
    { user: createdUsers[4], menu: menus[0], status: 'PREPARING' as const, paymentStatus: 'COMPLETED' as const },
    { user: createdUsers[5], menu: menus[1], status: 'READY' as const, paymentStatus: 'COMPLETED' as const },
    { user: createdUsers[6], menu: menus[2], status: 'COMPLETED' as const, paymentStatus: 'COMPLETED' as const },
  ];

  const createdBookings = [];
  for (const booking of bookingData) {
    // Get recipes from menu courses
    const menuCourses = booking.menu.courses as any;
    const firstRecipe = createdRecipes.find(r => r.id === menuCourses.primo?.[0]?.recipeId);
    const beverage = createdRecipes.find(r => r.id === menuCourses.extra?.[0]?.recipeId);

    const newBooking = await prisma.booking.create({
      data: {
        userId: booking.user.id,
        menuId: booking.menu.id,
        date: booking.menu.startDate,
        mealType: booking.menu.mealType,
        totalPrice: 1200, // €12.00
        paymentMethod: 'BADGE',
        paymentStatus: booking.paymentStatus,
        status: booking.status,
        confirmedAt: booking.status !== 'PENDING' ? new Date() : null,
        completedAt: booking.status === 'COMPLETED' ? new Date() : null,
        items: {
          create: [
            {
              recipeId: firstRecipe?.id || menuCourses.primo?.[0]?.recipeId || 'default-recipe-id',
              recipeName: firstRecipe?.name || 'Primo Piatto',
              recipeCategory: 'FIRST_COURSE',
              quantity: 1,
              unitPrice: 800,
              subtotal: 800,
            },
            {
              recipeId: beverage?.id || menuCourses.extra?.[0]?.recipeId || 'default-beverage-id',
              recipeName: beverage?.name || 'Bevanda',
              recipeCategory: 'BEVERAGE',
              quantity: 1,
              unitPrice: 400,
              subtotal: 400,
            },
          ],
        },
      },
    });
    createdBookings.push(newBooking);
  }
  console.log(`✅ Created ${createdBookings.length} sample bookings`);

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`  - ${createdUsers.length} users`);
  console.log(`  - ${createdRecipes.length} recipes`);
  console.log(`  - ${menus.length} menus`);
  console.log(`  - ${bookingRules.length} booking rules`);
  console.log(`  - ${createdGroups.length} groups`);
  console.log(`  - ${createdBookings.length} sample bookings`);
  console.log('');
  console.log('📧 Login Credentials (all users):');
  console.log('  Super Admin: admin@redbullracing.com / Admin123!');
  console.log('  Kitchen Admin: chef@redbullracing.com / Chef123!');
  console.log('  Customer Admin: manager@redbullracing.com / Manager123!');
  console.log('  End User: driver@redbullracing.com / Driver123!');
  console.log('  (+ 11 additional users - password format: FirstName123!)');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
