# Red Bull Racing - Developer Documentation

## 📚 Complete Development Reference

Questa cartella contiene la documentazione completa per lo sviluppo della piattaforma Red Bull Racing Meal Booking. Tutti i file sono strutturati per fornire riferimenti rapidi e pattern riutilizzabili.

---

## 📖 Documentation Index

### 1. **System Architecture** (`../architecture/SYSTEM_ARCHITECTURE.md`)
Documentazione completa del sistema:
- Stack tecnologico completo (Frontend, Backend, Infrastructure)
- Diagramma architetturale
- Struttura directory con 180+ file
- 16 modelli Prisma con codice completo
- 30+ endpoint API documentati
- Inventario completo dei componenti UI
- Definizioni RBAC con permessi specifici
- Metriche di performance
- Stato attuale: 99/100 production ready

**Quando usarla**: Per comprendere l'architettura generale del sistema.

---

### 2. **Development Patterns** (`DEVELOPMENT_PATTERNS.md`)
Pattern e best practices specifiche per lo stack:
- Pattern Next.js 15 App Router (Page, API Route, Middleware)
- Best practices Prisma 6.2.0 con campo existence check critico
- Pattern React Hook Form + Zod
- Pattern Framer Motion per animazioni
- Type patterns TypeScript
- Comandi Docker per sviluppo
- Pattern error handling (client & server)
- Ottimizzazione performance
- Best practices sicurezza

**Quando usarla**: Come riferimento quando scrivi nuovo codice.

---

### 3. **Code Templates** (`CODE_TEMPLATES.md`)
Template pronti da copiare per operazioni comuni:
1. **New API Route Template** - Completo con GET/POST
2. **API Route with ID Template** - GET/PUT/DELETE
3. **Dashboard Page Template** - Con loading/error states
4. **Form Dialog Component** - Create/Edit mode
5. **Data Table Page Template** - Con CRUD operations
6. **Utility Functions Template** - Date, money, validation
7. **Prisma Query Templates** - 10+ query patterns comuni

**Quando usarla**: Per creare rapidamente nuovi componenti o API.

---

### 4. **Tech Stack Reference** (`TECH_STACK_REFERENCE.md`)
Quick reference per ogni tecnologia:
- **Next.js 15**: File-based routing, directives, metadata API
- **React 19**: Nuovi hooks (useFormStatus, useOptimistic)
- **Prisma 6.2.0**: Comandi, query operations, relations, transactions
- **NextAuth 5**: Configuration, usage in server/client
- **Zod**: Schema definition patterns, validation
- **Tailwind CSS**: Custom colors, custom classes
- **Framer Motion**: Animation patterns
- **Docker**: Comandi completi
- **Environment Variables**: Tutte le variabili necessarie
- **Common Errors**: Soluzioni rapide
- **Checklists**: Performance & Security

**Quando usarla**: Per consultare rapidamente sintassi e comandi specifici.

---

### 5. **Utility Scripts** (`../scripts/dev-utils.sh`)
Script bash per operazioni comuni:
- `rebuild` - Full rebuild completo
- `restart` - Quick restart app
- `logs [service]` - Visualizza log
- `migrate <name>` - Crea migration
- `db:reset` - Reset database
- `db:shell` - Shell PostgreSQL
- `db:seed` - Seed database
- `prisma:generate` - Genera client
- `prisma:studio` - Apri Prisma Studio
- `health` - Check health services
- `test` - Run tests
- `typecheck` - Type check
- `cleanup` - Pulizia completa

**Quando usarli**: Per automatizzare operazioni ripetitive.

---

## 🚀 Quick Start Guide

### Per Nuovi Sviluppatori

1. **Leggi prima**:
   - `../architecture/SYSTEM_ARCHITECTURE.md` per overview generale
   - `DEVELOPMENT_PATTERNS.md` per capire i pattern usati

2. **Setup ambiente**:
   ```bash
   # Clone repository
   git clone <repo-url>
   cd REDBULL_APP

   # Copy environment file
   cp .env.example .env

   # Start services
   docker-compose up -d

   # Check health
   ./scripts/dev-utils.sh health
   ```

3. **Prima feature**:
   - Apri `CODE_TEMPLATES.md`
   - Copia template appropriato
   - Personalizza per la tua feature
   - Usa `TECH_STACK_REFERENCE.md` per sintassi specifica

---

## 🔑 Critical Information

### ⚠️ CRITICAL: Prisma Field Existence

**SEMPRE verificare che i campi esistano nello schema prima di usarli!**

**Modelli CON `isActive`**:
- `PaymentGatewayConfig`
- `Recipe` (usa `isAvailable`)
- `Menu`
- `BookingRule`
- `Group`

**Modelli SENZA `isActive`**:
- `User` ❌
- `Booking` ❌ (usa `status` invece)
- `AuditLog` ❌

**Errore comune**:
```typescript
// ❌ SBAGLIATO - Causa errore "Unknown argument 'isActive'"
const users = await prisma.user.count({
  where: { isActive: true }
});

// ✅ CORRETTO
const users = await prisma.user.count({
  where: { role: 'END_USER' }
});
```

### 🔒 Security Checklist

Prima di committare codice, verifica:
- ✅ Input validato con Zod
- ✅ Authentication check (getServerSession)
- ✅ Authorization check (role verification)
- ✅ Password NON esposta in query
- ✅ Bcrypt con 12 rounds per password
- ✅ No SQL injection (Prisma gestisce questo)

### ⚡ Performance Checklist

- ✅ `Promise.all()` per query parallele
- ✅ `select` per limitare campi
- ✅ Paginazione per large datasets
- ✅ `force-dynamic` per real-time data
- ✅ Indexes su campi frequentemente interrogati

---

## 📁 Directory Structure

```
docs/
├── architecture/
│   └── SYSTEM_ARCHITECTURE.md      # Architettura completa del sistema
└── development/
    ├── README.md                   # Questo file
    ├── DEVELOPMENT_PATTERNS.md     # Pattern e best practices
    ├── CODE_TEMPLATES.md           # Template riutilizzabili
    └── TECH_STACK_REFERENCE.md     # Quick reference tecnologie

scripts/
└── dev-utils.sh                    # Utility scripts
```

---

## 🔗 Quick Links

### Application URLs
- **Main App**: http://localhost:3001
- **Nginx**: http://localhost:8081
- **pgAdmin**: http://localhost:8082
- **MinIO Console**: http://localhost:9005
- **Portainer**: http://localhost:9100

### Development Resources
- **Next.js 15 Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **NextAuth Docs**: https://authjs.dev
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Framer Motion**: https://www.framer.com/motion
- **shadcn/ui**: https://ui.shadcn.com

---

## 💡 Tips & Tricks

### 1. Sviluppo Veloce

```bash
# Terminal 1: Watch logs
./scripts/dev-utils.sh logs app

# Terminal 2: Develop
# Modifica file
# Salva (hot reload automatico)

# Se cambi Prisma schema:
./scripts/dev-utils.sh migrate add_my_changes
```

### 2. Debugging

```typescript
// Server-side (appare nei log Docker)
console.log('[DEBUG]', data);

// Client-side (appare in browser console)
console.log('[CLIENT]', data);

// API route debugging
console.error('[API] Error:', error);
```

### 3. Testing Rapido

```bash
# Test endpoint
curl -I http://localhost:3001/api/endpoint

# Test con auth (copy token from browser DevTools)
curl -H "Cookie: authjs.session-token=TOKEN" \
  http://localhost:3001/api/protected

# Test database query
./scripts/dev-utils.sh db:shell
# Then run SQL queries
```

### 4. Troubleshooting

**App non parte?**
```bash
./scripts/dev-utils.sh health
# Se unhealthy:
./scripts/dev-utils.sh rebuild
```

**Database error?**
```bash
./scripts/dev-utils.sh db:reset
./scripts/dev-utils.sh db:seed
```

**Cambiamenti non applicati?**
```bash
./scripts/dev-utils.sh rebuild
```

---

## 🎯 Development Workflow

### Workflow Standard

1. **Feature Planning**
   - Leggi SYSTEM_ARCHITECTURE.md per contesto
   - Identifica modelli Prisma necessari
   - Verifica permessi RBAC per il ruolo

2. **Implementazione**
   - Usa CODE_TEMPLATES.md per struttura base
   - Segui DEVELOPMENT_PATTERNS.md per best practices
   - Consulta TECH_STACK_REFERENCE.md per sintassi

3. **Testing**
   - Test manuale tramite UI
   - Verifica logs: `./scripts/dev-utils.sh logs app`
   - Check health: `./scripts/dev-utils.sh health`

4. **Commit**
   - Type check: `./scripts/dev-utils.sh typecheck`
   - Run tests: `./scripts/dev-utils.sh test`
   - Verifica Security Checklist
   - Commit con messaggio descrittivo

### Workflow per API Route

1. Copia template da CODE_TEMPLATES.md
2. Definisci schema Zod per validation
3. Implementa authentication check
4. Implementa authorization check
5. Scrivi Prisma queries (verifica campi esistono!)
6. Test con curl o Postman
7. Verifica logs per errori

### Workflow per Dashboard Page

1. Copia template da CODE_TEMPLATES.md
2. Definisci interfaccia TypeScript per data
3. Implementa fetch function
4. Gestisci loading/error/data states
5. Aggiungi animazioni Framer Motion
6. Test in browser
7. Verifica responsive design

---

## 📊 Project Status

**Current Version**: v2.5.10.35 Diamond Class
**Production Readiness**: 99/100
**Last Updated**: 2025-10-22

**Completed**:
- ✅ Authentication & Authorization (NextAuth v5)
- ✅ 4 Role-based dashboards
- ✅ Real-time statistics APIs
- ✅ CRUD operations for all resources
- ✅ Docker multi-container setup
- ✅ Prisma schema with 16 models
- ✅ UI component library (shadcn/ui)
- ✅ Framer Motion animations
- ✅ Responsive design

**Remaining**:
- ⏳ End-to-end testing
- ⏳ Performance monitoring integration

---

## 🤝 Contributing

Quando aggiungi nuove funzionalità:

1. **Aggiorna documentazione** se aggiungi:
   - Nuovi pattern (DEVELOPMENT_PATTERNS.md)
   - Nuovi template (CODE_TEMPLATES.md)
   - Nuove tecnologie (TECH_STACK_REFERENCE.md)

2. **Mantieni consistency**:
   - Usa pattern esistenti
   - Segui naming conventions
   - Usa colori Red Bull Racing

3. **Test thoroughly**:
   - Tutti i ruoli RBAC
   - Loading/Error states
   - Mobile responsive
   - Logs puliti

---

## 📞 Support

Per domande o problemi:
1. Consulta questa documentazione
2. Verifica TECH_STACK_REFERENCE.md per errori comuni
3. Controlla logs: `./scripts/dev-utils.sh logs app`
4. Usa `./scripts/dev-utils.sh health` per diagnostics

---

**Happy Coding! 🏎️💨**
