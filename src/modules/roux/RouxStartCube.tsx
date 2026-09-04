import { useEffect, useState } from 'react';
import { physicalCubeAdapter, reconnectApprovedCube } from '../../hardware/smartcube/physicalCube';
import type {
  BluetoothDiagnostics,
  ConnectionState,
  CubeOrientation,
  CubeState,
  SmartCubeAdapter,
} from '../../hardware/smartcube/types';
import { validateFacelets } from './faceletSolver';
import { LivePhysicalCubeViewer } from './LivePhysicalCubeViewer';

const connectionLabel: Record<ConnectionState, string> = {
  unsupported: 'Bluetooth er ikke tilgængelig her',
  disconnected: 'GoCube er ikke forbundet',
  connecting: 'Forsøger at forbinde …',
  connected: 'GoCube følger med',
  error: 'GoCube kunne ikke nås',
};

type ConnectionPath = 'chooser' | 'remembered';

function errorCode(error: Error & { code?: unknown }): string {
  if (typeof error.code === 'string') return error.code;
  const conditionCode = (error as unknown as Record<PropertyKey, unknown>)[
    Symbol.for('beacio.conditionCode')
  ];
  return typeof conditionCode === 'string' ? conditionCode : '';
}

export function connectionErrorMessage(
  error: unknown,
  path: ConnectionPath,
  diagnostics?: BluetoothDiagnostics
): string {
  if (!(error instanceof Error)) return 'Bluetooth-forbindelsen mislykkedes.';
  const code = errorCode(error);
  if (
    code === 'EXTENSION_NOT_INSTALLED' ||
    code === 'EXTENSION_NOT_ENABLED' ||
    diagnostics?.api === 'missing'
  ) {
    return diagnostics?.extension === 'installed-inactive'
      ? 'Beacio er installeret, men Safari-udvidelsen er ikke aktiv på denne side.'
      : 'Beacio er ikke aktiv. Installér eller aktivér Safari-udvidelsen, og genindlæs siden.';
  }
  if (code === 'USER_CANCELLED') return 'Du lukkede enhedsvælgeren uden at vælge en cube.';
  if (code === 'DEVICE_NOT_FOUND') {
    return 'Ingen kompatibel cube blev fundet. Væk GoCube, hold den tæt på, og prøv igen.';
  }
  if (error.name === 'NotFoundError') {
    return 'Der blev ikke valgt en cube. Vinduet kan være annulleret, eller ingen vågen GoCube blev fundet.';
  }
  if (error.name === 'NetworkError') {
    return path === 'remembered'
      ? 'Bluetooth-tilladelsen findes, men cuben svarer ikke. Væk den; hvis den er vågen, luk andre apps eller faner. Tryk Tilslut igen for at åbne enhedsvælgeren.'
      : 'Cuben blev valgt, men svarer ikke. Væk den; hvis den er vågen, kan en anden app eller fane have forbindelsen.';
  }
  if (code === 'PERMISSION_DENIED' || error.name === 'SecurityError') {
    return 'Safari afviste Bluetooth-starten. Tryk Tilslut igen direkte på denne side.';
  }
  if (code === 'TIMEOUT' || error.name === 'TimeoutError' || /timed out/i.test(error.message)) {
    return 'Bluetooth-forbindelsen blev åbnet, men cuben sendte ingen gyldig tilstand. Væk cuben, og prøv igen.';
  }
  return error.message;
}

function unavailableMessage(diagnostics?: BluetoothDiagnostics): string {
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return 'Bluetooth kræver en sikker HTTPS-side. Åbn PeterLingo via det normale websted, og prøv igen.';
  }
  if (!diagnostics) return 'Bluetooth er ikke tilgængelig i denne browser.';
  if (diagnostics.extension === 'installed-inactive') {
    return 'Beacio er installeret, men udvidelsen er slået fra eller ikke tilladt på PeterLingo. Aktivér den i Safari, og genindlæs.';
  }
  if (diagnostics.extension === 'not-installed') {
    return 'Beacio er ikke aktiv på iPad. Installér Beacio, aktivér Safari-udvidelsen for PeterLingo, og genindlæs.';
  }
  return 'Bluetooth-API’et mangler. Brug Safari med Beacio på iPad eller Chrome/Edge på computer.';
}

function pickerStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    'Select your cube…': 'Vælg din cube i browserens Bluetooth-vindue …',
    'Reading advertisements…': 'Cuben er valgt. Læser dens Bluetooth-oplysninger …',
    'Connecting…': 'Cuben er fundet. Opretter forbindelsen …',
    'Verifying connection…': 'Kontrollerer forbindelsen …',
  };
  return messages[status] ?? status;
}

export function RouxStartCube({
  adapter = physicalCubeAdapter,
  onQuickSolve,
  onManualCorrection,
  manualFacelets = null,
  onHardwareStateRequested,
}: {
  adapter?: SmartCubeAdapter;
  onQuickSolve?(): void;
  onManualCorrection?(): void;
  manualFacelets?: string | null;
  onHardwareStateRequested?(): void;
}) {
  const [connection, setConnection] = useState<ConnectionState>(() => adapter.getConnectionState());
  const [cubeState, setCubeState] = useState<CubeState | null>(() => adapter.getCubeState());
  const [orientation, setOrientation] = useState<CubeOrientation | null>(
    () => adapter.getOrientation?.() ?? null
  );
  const [orientationReference, setOrientationReference] = useState<
    CubeOrientation | null | undefined
  >(undefined);
  const [message, setMessage] = useState('');
  const [syncError, setSyncError] = useState('');
  const [busyAction, setBusyAction] = useState<'connect' | 'read' | null>(null);
  const [rememberedCubes, setRememberedCubes] =
    useState<Awaited<ReturnType<NonNullable<SmartCubeAdapter['getRememberedCubes']>>>>(null);
  const diagnostics = adapter.getBluetoothDiagnostics?.();

  useEffect(() => {
    let active = true;
    const refresh = (nextState?: CubeState | null) => {
      if (!active) return;
      const nextConnection = adapter.getConnectionState();
      setConnection(nextConnection);
      setCubeState(nextState === undefined ? adapter.getCubeState() : nextState);
      if (nextConnection !== 'connected') setOrientation(null);
    };
    const offState = adapter.subscribeToState?.((nextState) => refresh(nextState));
    const offOrientation = adapter.subscribeToOrientation?.((nextOrientation) => {
      if (!active) return;
      setOrientation(nextOrientation);
      refresh();
    });

    const reconnect = async () => {
      if (!adapter.isSupported()) {
        setConnection('unsupported');
        setMessage(unavailableMessage(adapter.getBluetoothDiagnostics?.()));
        return;
      }
      if (adapter.getConnectionState() === 'connected') {
        refresh();
        return;
      }
      setMessage('Leder efter en cube, som browseren allerede kender …');
      let connected = await reconnectApprovedCube(adapter);
      if (!connected && active && adapter.getConnectionState() !== 'connected') {
        connected = await reconnectApprovedCube(adapter, { retry: true });
      }
      if (!active) return;
      refresh();
      setMessage(
        connected
          ? 'Forbindelsen blev genetableret automatisk.'
          : 'Tænd eller bevæg cuben. Tryk Tilslut, hvis den ikke vågner automatisk.'
      );
    };

    const retryWhenVisible = () => {
      if (document.visibilityState === 'visible' && adapter.getConnectionState() !== 'connected') {
        void reconnect();
      }
    };

    const preloadRemembered = async () => {
      if (adapter.canReconnectRemembered?.() === false || !adapter.getRememberedCubes) {
        setRememberedCubes(null);
        return;
      }
      try {
        setRememberedCubes(await adapter.getRememberedCubes());
      } catch {
        setRememberedCubes(null);
      }
    };

    void preloadRemembered();
    void reconnect();
    window.addEventListener('focus', retryWhenVisible);
    document.addEventListener('visibilitychange', retryWhenVisible);
    return () => {
      active = false;
      window.removeEventListener('focus', retryWhenVisible);
      document.removeEventListener('visibilitychange', retryWhenVisible);
      offState?.();
      offOrientation?.();
    };
  }, [adapter]);

  const connect = async () => {
    if (busyAction || connection === 'connecting') return;
    setBusyAction('connect');
    setConnection('connecting');
    const remembered = rememberedCubes?.length === 1 ? rememberedCubes[0] : undefined;
    const useRemembered = Boolean(remembered && adapter.connectRemembered);
    setMessage(
      useRemembered
        ? `Forbinder direkte til ${remembered!.name} …`
        : 'Åbner browserens Bluetooth-vindue …'
    );
    try {
      if (useRemembered) {
        await adapter.connectRemembered!(remembered!.id, (status) => setMessage(status));
      } else {
        // Do not await getDevices() here. This call must reach requestDevice()
        // directly from the click so iPad Safari preserves user activation.
        await adapter.connect((status) => setMessage(pickerStatusMessage(status)));
      }
      setConnection(adapter.getConnectionState());
      setCubeState(adapter.getCubeState());
      setMessage('GoCube er klar. Du kan begynde med det samme.');
    } catch (error) {
      if (useRemembered) setRememberedCubes(null);
      setConnection(adapter.getConnectionState());
      setMessage(
        connectionErrorMessage(
          error,
          useRemembered ? 'remembered' : 'chooser',
          adapter.getBluetoothDiagnostics?.()
        )
      );
    } finally {
      setBusyAction(null);
    }
  };

  const calibrateViewer = () => {
    const currentOrientation = adapter.getOrientation?.() ?? orientation;
    if (connection !== 'connected' || !currentOrientation) return;
    setOrientationReference(currentOrientation);
    setMessage('3D-cuben er rettet ind efter den måde, du holder den på. Cubens farver er urørte.');
  };

  const rereadCube = async () => {
    if (!adapter.requestState || connection !== 'connected' || busyAction) return;
    setBusyAction('read');
    setSyncError('');
    setMessage('Beder GoCube om en frisk aflæsning …');
    try {
      await adapter.requestState();
      onHardwareStateRequested?.();
      setCubeState(adapter.getCubeState());
      setMessage('Farverne er hentet fra GoCube igen. Den fysiske cube blev ikke ændret.');
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Cuben kunne ikke læses igen.';
      setSyncError(nextMessage);
      setMessage(nextMessage);
    } finally {
      setBusyAction(null);
      setConnection(adapter.getConnectionState());
    }
  };

  const canCalibrate = connection === 'connected' && Boolean(orientation);
  const canReread = connection === 'connected' && Boolean(adapter.requestState);
  const hardwareFaceletsAreValid = Boolean(
    cubeState?.facelets && validateFacelets(cubeState.facelets).ok
  );
  const canQuickSolve =
    Boolean(manualFacelets && validateFacelets(manualFacelets).ok) ||
    (connection === 'connected' &&
      cubeState?.synchronization === 'synchronized' &&
      hardwareFaceletsAreValid);

  const displayedMessage =
    syncError ||
    (manualFacelets !== null
      ? 'Manuelt rettede farver er låst. Nye hardwaremålinger overskriver dem ikke, før du vælger Synkronisér farver.'
      : connection === 'connected' && cubeState?.synchronization === 'desynchronized'
        ? 'Bluetooth er forbundet, men GoCube har ikke sendt en gyldig farvetilstand. Væk cuben, synkronisér igen, eller ret farverne manuelt.'
        : connection === 'connected' &&
            cubeState?.synchronization === 'synchronized' &&
            !hardwareFaceletsAreValid
          ? 'Bluetooth er forbundet, men GoCubens farvetilstand er ugyldig. Synkronisér igen, eller ret farverne manuelt.'
          : connection === 'connected' && !orientation
            ? message ||
              'Farverne er live. Bevæg cuben lidt, hvis 3D-retningen også skal følge med.'
            : message);

  return (
    <section className="roux-start-cube" aria-label="Live GoCube">
      <div className="roux-start-viewer">
        <div className="cube-hold-guide cube-hold-guide-top" aria-hidden="true">
          <b>HVID / GO</b>
          <span>↑ op</span>
        </div>
        <LivePhysicalCubeViewer
          adapter={adapter}
          orientationReference={orientationReference}
          faceletsOverride={manualFacelets}
        />
        <div className="cube-hold-guide cube-hold-guide-front" aria-hidden="true">
          <i />
          <span>Grøn side mod dig</span>
        </div>
      </div>
      <div className="roux-start-cube-controls">
        <div className={`cube-connection-state ${connection === 'connected' ? 'connected' : ''}`}>
          <i aria-hidden="true" />
          <span>{connectionLabel[connection]}</span>
        </div>
        <p className="roux-start-cube-message" aria-live="polite">
          {displayedMessage}
        </p>
        <div className="roux-cube-primary-actions">
          {connection !== 'connected' && (
            <button
              type="button"
              className="button primary"
              disabled={busyAction === 'connect' || !adapter.isSupported()}
              onClick={() => void connect()}
            >
              {busyAction === 'connect' ? 'Tilslutter …' : 'Tilslut'}
            </button>
          )}
          <button
            type="button"
            className="button secondary"
            disabled={!canCalibrate}
            onClick={calibrateViewer}
          >
            Kalibrer 3D
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={!canReread || busyAction === 'read'}
            onClick={() => void rereadCube()}
          >
            {busyAction === 'read' ? 'Synkroniserer …' : 'Synkronisér farver'}
          </button>
          <button type="button" className="button secondary" onClick={onManualCorrection}>
            Ret farver manuelt
          </button>
          <button
            type="button"
            className="button solve"
            disabled={!canQuickSolve}
            onClick={onQuickSolve}
          >
            Løs hurtigt
          </button>
        </div>
        <ul className="roux-cube-action-help">
          <li>
            <b>Kalibrer 3D</b> retter kun modellens retning.
          </li>
          <li>
            <b>Synkronisér farver</b> beder GoCube om alle farver igen. Den ændrer hverken den
            fysiske cube, 3D-kalibreringen eller en blandet cube til løst.
          </li>
          <li>
            <b>Ret farver manuelt</b> beskriver den fysiske tilstand, hvis målingen stadig er
            forkert.
          </li>
        </ul>
        {diagnostics && (
          <details className="roux-bluetooth-details">
            <summary>Tekniske Bluetooth-detaljer</summary>
            <dl>
              <div>
                <dt>Bluetooth-sti</dt>
                <dd>
                  {diagnostics.api === 'beacio'
                    ? 'Beacio Safari-udvidelse'
                    : diagnostics.api === 'native'
                      ? 'Browserens Web Bluetooth'
                      : 'Ingen aktiv API'}
                </dd>
              </div>
              <div>
                <dt>Beacio</dt>
                <dd>
                  {diagnostics.extension === 'not-needed'
                    ? 'Ikke nødvendig'
                    : diagnostics.extension === 'active'
                      ? 'Aktiv'
                      : diagnostics.extension === 'installed-inactive'
                        ? 'Installeret, men ikke aktiv'
                        : 'Ikke fundet'}
                </dd>
              </div>
              <div>
                <dt>Direkte genforbindelse</dt>
                <dd>
                  {diagnostics.rememberedReconnect
                    ? 'Understøttet via getDevices()'
                    : 'Ikke understøttet på denne sti'}
                </dd>
              </div>
              <div>
                <dt>Beacio core</dt>
                <dd>{diagnostics.libraryVersion}</dd>
              </div>
            </dl>
            <p>Enhedsvælgerens filtre: {diagnostics.filters.join(', ')}.</p>
            <p>
              Ser du stadig den gamle tekst “Læs cuben igen”, kører iPad en ældre PWA-version.
              Genindlæs siden eller luk og åbn PeterLingo; du skal ikke slette lokale læringsdata.
            </p>
          </details>
        )}
      </div>
    </section>
  );
}
