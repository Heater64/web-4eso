# Web 4 ESO - Plataforma Educativa para 4ESO

Una plataforma web educativa moderna para organizar el material académico de 4ESO.

## Caracteristicas

- Dashboard moderno con estadisticas en tiempo real
- Sistema de autenticacion con roles (admin/usuario)
- Gestion de asignaturas y temas
- Upload de archivos PDF e imagenes
- Sistema de recomendaciones por tema
- Diseno oscuro premium con glassmorphism
- Totalmente responsive (movil, tablet, desktop)
- Animaciones suaves y profesionales

## Stack Tecnologico

- HTML5
- CSS3 (Variables CSS, Grid, Flexbox)
- Vanilla JavaScript (ES6+)
- Supabase (Auth, Database, Storage)
- Lucide Icons (inline SVG)
- Google Fonts (Inter)

## Estructura del Proyecto

```
web4eso/
├── index.html              # Pagina principal (redireccion)
├── login.html              # Pagina de login/registro
├── dashboard.html          # Dashboard principal
├── subject.html            # Detalle de asignatura
│
├── css/
│   ├── variables.css       # Variables CSS y design system
│   ├── animations.css      # Animaciones y transiciones
│   ├── style.css           # Estilos globales
│   ├── auth.css            # Estilos de autenticacion
│   └── dashboard.css       # Estilos del dashboard
│
├── js/
│   ├── supabase.js         # Configuracion y API de Supabase
│   ├── auth.js             # Modulo de autenticacion
│   ├── ui.js               # Componentes UI reutilizables
│   ├── dashboard.js        # Logica del dashboard
│   └── subjects.js         # Logica de asignaturas
│
└── assets/
    ├── icons/
    └── images/
```

## Configuracion de Supabase

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Anota la URL y la anon key del proyecto

### 2. Configurar la Base de Datos

Ejecuta los siguientes scripts SQL en el editor SQL de Supabase:

```sql
-- Perfiles de usuario
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asignaturas
CREATE TABLE subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'bookOpen',
    description TEXT,
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Temas
CREATE TABLE topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Archivos
CREATE TABLE files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'image', 'other')),
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recomendaciones
CREATE TABLE recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Configurar Row Level Security (RLS)

```sql
-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Politicas de lectura (todos pueden leer)
CREATE POLICY "Public profiles are viewable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Subjects are viewable" ON subjects FOR SELECT USING (true);
CREATE POLICY "Topics are viewable" ON topics FOR SELECT USING (true);
CREATE POLICY "Files are viewable" ON files FOR SELECT USING (true);
CREATE POLICY "Recommendations are viewable" ON recommendations FOR SELECT USING (true);

-- Politicas de escritura (usuarios autenticados)
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Authenticated users can insert subjects" ON subjects FOR INSERT WITH (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update subjects" ON subjects FOR UPDATE WITH (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete subjects" ON subjects FOR DELETE WITH (auth.role() = 'authenticated');

-- Similar para topics, files y recommendations...
```

### 4. Configurar Storage

```sql
-- Crear bucket para archivos
INSERT INTO storage.buckets (id, name, public) VALUES ('files', 'files', true);

-- Politicas de storage
CREATE POLICY "Anyone can view files" ON storage.objects FOR SELECT USING (bucket_id = 'files');
CREATE POLICY "Authenticated users can upload files" ON storage.objects FOR INSERT WITH (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete files" ON storage.objects FOR DELETE WITH (auth.role() = 'authenticated');
```

### 5. Actualizar Credenciales

Edita el archivo `js/supabase.js` y reemplaza:

```javascript
const SUPABASE_URL = 'TU_URL';
const SUPABASE_ANON_KEY = 'TU_ANON_KEY';
```

Con tus credenciales de Supabase:

```javascript
const SUPABASE_URL = 'https://tuproyecto.supabase.co';
const SUPABASE_ANON_KEY = 'tu-anon-key-aqui';
```

## Crear Usuario Administrador

Para crear un usuario administrador, primero registra una cuenta normal y luego actualiza su rol:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'tu-email@ejemplo.com';
```

## Despliegue

### Vercel

1. Sube el proyecto a GitHub
2. Conecta el repositorio en Vercel
3. Despliega como proyecto estatico

### GitHub Pages

1. Ve a Settings > Pages
2. Selecciona la rama principal
3. Guarda y espera el despliegue

### Netlify

1. Conecta tu repositorio de GitHub
2. Configura como sitio estatico
3. Despliega

## Uso

### Roles

- **Admin**: Puede crear/editar/eliminar asignaturas, temas, archivos y recomendaciones
- **Usuario**: Solo puede visualizar el contenido

### Navegacion

1. **Dashboard**: Vista general con estadisticas y acceso rapido
2. **Asignaturas**: Lista de todas las asignaturas
3. **Archivos**: Archivos recientes
4. **Recomendaciones**: Recomendaciones recientes

### Gestion de Contenido

1. Crear asignatura desde el dashboard (admin)
2. Entrar en una asignatura para ver temas
3. Crear temas dentro de cada asignatura (admin)
4. Subir archivos PDF o imagenes a cada tema (admin)
5. Agregar recomendaciones con enlaces externos (admin)

## Personalizacion

### Colores

Edita `css/variables.css` para cambiar la paleta de colores:

```css
:root {
  --accent-primary: #6366f1;
  --bg-primary: #0f1115;
  --bg-secondary: #151821;
  /* ... */
}
```

### Iconos

Los iconos estan definidos en `js/ui.js` como SVG inline. Puedes agregar mas iconos siguiendo el mismo formato.

## Estructura de la Base de Datos

```
profiles (usuarios)
    |
    v
subjects (asignaturas)
    |
    v
topics (temas)
    |
    +-- files (archivos)
    |
    +-- recommendations (recomendaciones)
```

## API Reference

### SupabaseModule

```javascript
// Inicializar
await SupabaseModule.init();

// Profiles
await SupabaseModule.Profiles.getCurrentProfile();
await SupabaseModule.Profiles.isAdmin();

// Subjects
await SupabaseModule.Subjects.getAll();
await SupabaseModule.Subjects.getById(id);
await SupabaseModule.Subjects.create(data);
await SupabaseModule.Subjects.update(id, data);
await SupabaseModule.Subjects.delete(id);

// Topics
await SupabaseModule.Topics.getBySubject(subjectId);
await SupabaseModule.Topics.create(data);
await SupabaseModule.Topics.delete(id);

// Files
await SupabaseModule.Files.getByTopic(topicId);
await SupabaseModule.Files.upload(file, topicId);
await SupabaseModule.Files.delete(id, fileUrl);

// Recommendations
await SupabaseModule.Recommendations.getByTopic(topicId);
await SupabaseModule.Recommendations.create(data);
await SupabaseModule.Recommendations.delete(id);
```

## Licencia

MIT License - Libre para uso personal y comercial.

## Autor

Creado para 4ESO - Plataforma Educativa Premium
