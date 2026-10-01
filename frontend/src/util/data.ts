/**
 * Data em ISO (yyyy-MM-dd) no fuso LOCAL.
 *
 * `toISOString()` converte para UTC antes de formatar: no Brasil, das 21h em
 * diante ele devolve o dia seguinte. Isso faria o lancamento das 21:30 cair no
 * dia errado e sumir do "hoje" do grid - que e exatamente quando se lanca hora.
 */
export function paraIso(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function hojeIso(): string {
  return paraIso(new Date());
}

/** yyyy-MM-dd -> dd/MM/yyyy. */
export function paraBrasileiro(iso: string): string {
  return iso.split('-').reverse().join('/');
}
