import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col gap-8">
        <Image
          src="/isotec-logo.webp"
          alt="ISOTEC Logo"
          width={200}
          height={80}
          priority
        />
        <h1 className="text-4xl font-bold text-center">
          Sistema de Contratos Fotovoltaicos
        </h1>
        <p className="text-center text-muted-foreground">
          Sistema de gestão de contratos para instalação de energia solar fotovoltaica
        </p>
        <div className="flex gap-4">
          <Link
            href="/wizard"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Criar Contrato
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Dashboard Admin
          </Link>
          <Link
            href="/contracts"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Visualizar Contrato
          </Link>
        </div>
      </div>
    </main>
  );
}
