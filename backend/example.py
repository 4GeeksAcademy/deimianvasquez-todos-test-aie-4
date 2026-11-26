import pandas as pd
from datetime import datetime, timedelta

# ─── Cargar datos ────────────────────────────────────────────
df = pd.read_csv('todos.csv')
df['completed_at'] = pd.to_datetime(df['completed_at'], errors='coerce')

hoy = datetime.now()
dentro_de_4_dias = hoy + timedelta(days=4)

print(f"📅 Hoy es: {hoy.strftime('%Y-%m-%d %A')}")
print("=" * 60)

# ─── 1. Tareas PENDING ────────────────────────────────────────
pending = df[df['status'] == 'pending']
print(f"\n⏳ Tareas PENDING ({len(pending)}):")
print("-" * 40)
for _, row in pending.iterrows():
    print(f"  ID: {row['id']:>3} | Usuario: {row['user_id']}")

# ─── 2. Tareas COMPLETED en los últimos 4 días ────────────────
cutoff = hoy - timedelta(days=4)
completadas_recientes = df[
    (df['status'] == 'completed') &
    (df['completed_at'] >= cutoff) &
    (df['completed_at'] <= hoy)
].sort_values('completed_at')

print(f"\n✅ Tareas COMPLETED en los últimos 4 días ({len(completadas_recientes)}):")
print("-" * 60)
for _, row in completadas_recientes.iterrows():
    fecha = row['completed_at'].strftime('%Y-%m-%d %H:%M')
    print(f"  ID: {row['id']:>3} | Usuario: {row['user_id']} | {fecha}")

# ─── 3. Tareas PENDING pero que se completarán pronto ─────────
print(f"\n🔮 Tareas que vencen en los próximos 4 días:")
print("-" * 50)
no_hay_vencidas = True
for _, row in df[df['status'] == 'pending'].iterrows():
    # Si no tiene completed_at, no sabemos cuándo vence :/
    print(f"  ID: {row['id']:>3} | Usuario: {row['user_id']} | ⏳ Sin fecha de vencimiento")
    no_hay_vencidas = False

if no_hay_vencidas:
    print("  No hay tareas pendientes con fecha de vencimiento próxima.")

print("\n" + "=" * 60)

# ─── 4. Resumen por usuario ───────────────────────────────────
print("\n📊 Resumen por usuario:")
print("-" * 40)
resumen = df.groupby('user_id')['status'].value_counts().unstack(fill_value=0)
if 'pending' not in resumen.columns:
    resumen['pending'] = 0
if 'completed' not in resumen.columns:
    resumen['completed'] = 0
resumen = resumen[['completed', 'pending']]
resumen.columns = ['✅ Completadas', '⏳ Pendientes']
resumen['📊 Total'] = resumen.sum(axis=1)
print(resumen.to_string())

                
