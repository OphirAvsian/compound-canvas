from collections.abc import Callable
from concurrent.futures import Future, ThreadPoolExecutor, TimeoutError
from threading import BoundedSemaphore

from .conformer import ConformerResult


class CalculationBusyError(RuntimeError):
    """Raised when all calculation slots are occupied."""


class CalculationTimeoutError(RuntimeError):
    """Raised when a calculation exceeds the public request deadline."""


ConformerFunction = Callable[..., ConformerResult]


class ConformerExecutor:
    def __init__(
        self,
        function: ConformerFunction,
        *,
        max_concurrency: int,
        timeout_seconds: float,
    ) -> None:
        self.function = function
        self.timeout_seconds = timeout_seconds
        self._slots = BoundedSemaphore(max_concurrency)
        self._executor = ThreadPoolExecutor(
            max_workers=max_concurrency,
            thread_name_prefix="rdkit-conformer",
        )
        self._shutdown = False

    @property
    def ready(self) -> bool:
        return not self._shutdown

    def run(
        self,
        *,
        smiles: str | None,
        molfile: str | None,
        seed: int,
    ) -> ConformerResult:
        if self._shutdown or not self._slots.acquire(blocking=False):
            raise CalculationBusyError

        future: Future[ConformerResult] = self._executor.submit(
            self.function,
            smiles=smiles,
            molfile=molfile,
            seed=seed,
        )
        future.add_done_callback(lambda _: self._slots.release())

        try:
            return future.result(timeout=self.timeout_seconds)
        except TimeoutError as error:
            raise CalculationTimeoutError from error

    def shutdown(self) -> None:
        self._shutdown = True
        self._executor.shutdown(wait=False, cancel_futures=True)
