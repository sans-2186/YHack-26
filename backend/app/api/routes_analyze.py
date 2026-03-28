from fastapi import APIRouter, HTTPException

from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse
from app.services import analysis_service

router = APIRouter(prefix="/analyze", tags=["analyze"])


@router.post("", response_model=AnalyzeResponse)
async def analyze_company(body: AnalyzeRequest) -> AnalyzeResponse:
    try:
        return await analysis_service.run_analysis(body.query, body.force_refresh)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except TimeoutError:
        raise HTTPException(
            status_code=504, detail="Upstream data source timed out"
        ) from None


@router.get("/{analysis_id}", response_model=AnalyzeResponse)
async def get_analysis(analysis_id: str) -> AnalyzeResponse:
    out = await analysis_service.get_analysis(analysis_id)
    if not out:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return out
